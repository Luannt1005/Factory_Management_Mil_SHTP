import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { getDbConnection } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
      // Giới hạn scope để giảm kích thước Token, giúp dễ đi qua Firewall nhà máy
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      httpOptions: {
        timeout: 20000,
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const pool = await getDbConnection();
        const result = await pool.query("SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER($1)", [credentials.username]);

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) return null;

        return {
          id: user.id.toString(),
          name: user.full_name || user.username,
          email: user.username,
          role: user.role || "user",
          orgchart_role: user.orgchart_role || "user",
          visitor_role: user.visitor_role || "user",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "azure-ad") {
          const profileData = profile as any;
          const fullEmail = (user.email || profileData?.preferred_username || profileData?.upn || profileData?.email)?.toLowerCase()?.trim();
          const usernamePart = fullEmail?.split('@')[0];
          const name = user.name || profile?.name || fullEmail;

          console.log("[SSO Login Attempt]", {
            email: fullEmail,
            name: name,
            provider: account.provider
          });

          if (!fullEmail) {
            console.error("[SSO Login Fail] No identifier found in profile");
            return false;
          }

          let pool;
          try {
            pool = await getDbConnection();
          } catch (dbErr: any) {
            console.error("[SSO DB Connection Error] Could not connect to database:", dbErr.message);
            return false;
          }

          // 1. Try matching with full email (case-insensitive and trimmed)
          let result;
          try {
            result = await pool.query("SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER($1)", [fullEmail]);
            
            // 2. If not found, try matching with the username part (before @)
            if (result.rows.length === 0 && usernamePart) {
              result = await pool.query("SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER($1)", [usernamePart]);
            }
          } catch (queryErr: any) {
            console.error("[SSO DB Query Error] Database query failed:", queryErr.message);
            return false;
          }

          // Call Graph API to get extra details
          let jobTitle = null, department = null, location = null;
          if (account?.access_token) {
            try {
              const detailsRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=jobTitle,department,officeLocation", {
                headers: { Authorization: `Bearer ${account.access_token}` }
              });
              if (detailsRes.ok) {
                const details = await detailsRes.json();
                jobTitle = details.jobTitle || null;
                department = details.department || null;
                location = details.officeLocation || null;
              }
            } catch (err) {
              console.error("[SSO Details Fetch Error]", err);
            }
          }

          if (result.rows.length === 0) {
            console.log("[SSO DB Lookup] User not found, creating new account for:", fullEmail);
            
            if (fullEmail.length > 50) {
              console.error("[SSO Login Fail] Email exceeds 50 character limit.");
              return false; 
            }

            const dummyPassword = "sso_user_no_password_" + Math.random().toString(36).substring(7);
            const insertResult = await pool.query(
              "INSERT INTO users (username, password, full_name, role, orgchart_role, visitor_role, job_title, department, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
              [fullEmail, dummyPassword, name, "user", "user", "user", jobTitle, department, location]
            );
            const newUser = insertResult.rows[0];
            user.id = newUser.id.toString();
            (user as any).role = newUser.role;
            (user as any).orgchart_role = newUser.orgchart_role;
            (user as any).visitor_role = newUser.visitor_role;
          } else {
            const existingUser = result.rows[0];
            
            // Update the existing user with new details if they are available from Graph API
            if (jobTitle || department || location) {
              await pool.query(
                "UPDATE users SET job_title = COALESCE($1, job_title), department = COALESCE($2, department), location = COALESCE($3, location) WHERE id = $4",
                [jobTitle, department, location, existingUser.id]
              );
            }

            user.id = existingUser.id.toString();
            (user as any).role = existingUser.role || "user";
            (user as any).orgchart_role = existingUser.orgchart_role || "user";
            (user as any).visitor_role = existingUser.visitor_role || "user";
            user.email = existingUser.username;
          }
        }
        return true;
      } catch (error: any) {
        console.error("[SSO Critical Error]", error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      // Khi người dùng mới đăng nhập (user có giá trị)
      if (user) {
        try {
          const pool = await getDbConnection();
          const profileData = profile as any;
          // Sử dụng cùng logic tìm kiếm như trong signIn
          const email = (user.email || profileData?.preferred_username || profileData?.upn || profileData?.email)?.toLowerCase()?.trim();
          
          if (email) {
            // Truy vấn lại DB để lấy thông tin chính xác nhất (bao gồm Role)
            const result = await pool.query(
              "SELECT id, username, full_name, role, orgchart_role, visitor_role, job_title, department, location FROM users WHERE LOWER(TRIM(username)) = LOWER($1) OR LOWER(TRIM(username)) = LOWER($2)", 
              [email, email.split('@')[0]]
            );

            if (result.rows.length > 0) {
              const dbUser = result.rows[0];
              token.id = dbUser.id.toString();
              token.role = dbUser.role || "user";
              token.orgchart_role = dbUser.orgchart_role || "user";
              token.visitor_role = dbUser.visitor_role || "user";
              token.email = dbUser.username;
              token.name = dbUser.full_name || token.name; // Keep native token.name if full_name is empty
              token.jobTitle = dbUser.job_title;
              token.department = dbUser.department;
              token.location = dbUser.location;
            } else {
              // Trường hợp hy hữu: User vừa đăng nhập thành công ở signIn nhưng DB chưa kịp cập nhật hoặc lỗi
              token.id = user.id;
              token.role = (user as any).role || "user";
              token.orgchart_role = (user as any).orgchart_role || "user";
              token.visitor_role = (user as any).visitor_role || "user";
              token.email = email;
            }
          }

          // Fetch Azure AD Profile Photo if using SSO
          if (account?.provider === "azure-ad") {
            const profileData = profile as any;
            // Nếu trong profile đã có sẵn chuỗi ảnh (base64 hoặc url), dùng luôn
            if (profileData?.picture || profileData?.image || user.image) {
              token.picture = profileData?.picture || profileData?.image || user.image;
            } 
            // Nếu không có, mới gọi Graph API để lấy
            else if (account.access_token) {
              try {
                const photoResponse = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
                  headers: { Authorization: `Bearer ${account.access_token}` }
                });
                
                if (photoResponse.ok) {
                  const buffer = await photoResponse.arrayBuffer();
                  const base64 = Buffer.from(buffer).toString("base64");
                  token.picture = `data:image/jpeg;base64,${base64}`;
                }
              } catch (photoErr) {
                console.error("[SSO Photo Fetch Error]", photoErr);
              }
            }
          }
        } catch (error) {
          console.error("[JWT Callback Error]", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).orgchart_role = token.orgchart_role;
        (session.user as any).visitor_role = token.visitor_role;
        (session.user as any).username = token.email;
        session.user.image = token.picture as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).full_name = token.name as string;
        
        (session.user as any).jobTitle = token.jobTitle;
        (session.user as any).department = token.department;
        (session.user as any).location = token.location;
      }
      console.log("[NextAuth Session]", { 
        user: session.user?.email, 
        role: (session.user as any).role,
        orgchart_role: (session.user as any).orgchart_role,
        visitor_role: (session.user as any).visitor_role
      });
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development",
};
