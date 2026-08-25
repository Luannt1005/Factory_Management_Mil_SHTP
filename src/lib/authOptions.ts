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
          app_role_ids: user.app_role_ids || [],
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

          let userStatus = "Active";

          if (result.rows.length === 0) {
            console.log("[SSO DB Lookup] User not found, creating new account for:", fullEmail);
            
            if (fullEmail.length > 50) {
              console.error("[SSO Login Fail] Email exceeds 50 character limit.");
              return false; 
            }

            userStatus = "Active";
            const dummyPassword = "sso_user_no_password_" + Math.random().toString(36).substring(7);
            
            // Get role IDs for default assignment
            const defaultRolesResult = await pool.query("SELECT id, name FROM app_roles WHERE name IN ('User Visitor', 'Admin Orgchart', 'Hr Visitor')");
            const roleMap = new Map();
            defaultRolesResult.rows.forEach((r: any) => roleMap.set(r.name, r.id));
            const userVisitorId = roleMap.get('User Visitor');
            const adminOrgchartId = roleMap.get('Admin Orgchart');
            const hrVisitorId = roleMap.get('Hr Visitor');
            
            const isExcludedFromDefaultUserVisitor = fullEmail?.toLowerCase().includes('outsourced.sec');
            let app_role_ids: string[] = [];
            if (userVisitorId && !isExcludedFromDefaultUserVisitor) app_role_ids.push(userVisitorId);
            if ((department === 'IDM Control' || department === 'Management') && adminOrgchartId) {
                app_role_ids.push(adminOrgchartId);
            }
            if ((department === 'HR-TA' || department?.toUpperCase()?.includes('HR-TA')) && hrVisitorId) {
                app_role_ids.push(hrVisitorId);
            }

            const insertResult = await pool.query(
              "INSERT INTO users (username, password, full_name, role, orgchart_role, visitor_role, job_title, department, location, status, app_role_ids) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
              [fullEmail, dummyPassword, name, "user", "user", "user", jobTitle, department, location, userStatus, app_role_ids]
            );
            const newUser = insertResult.rows[0];
            user.id = newUser.id.toString();
            (user as any).role = newUser.role;
            (user as any).orgchart_role = newUser.orgchart_role;
            (user as any).visitor_role = newUser.visitor_role;
            (user as any).app_role_ids = newUser.app_role_ids || [];
          } else {
            const existingUser = result.rows[0];

            userStatus = existingUser.status || "Active";
            // Auto-activate any previously pending approval accounts
            if (userStatus === "Pending Approval") {
              userStatus = "Active";
              await pool.query("UPDATE users SET status = 'Active' WHERE id = $1", [existingUser.id]);
            }
            
            let app_role_ids: string[] = existingUser.app_role_ids || [];
            let updatedRoles = false;
            
            // Get role IDs for default assignment
            const defaultRolesResult = await pool.query("SELECT id, name FROM app_roles WHERE name IN ('User Visitor', 'Admin Orgchart', 'Hr Visitor')");
            const roleMap = new Map();
            defaultRolesResult.rows.forEach((r: any) => roleMap.set(r.name, r.id));
            const userVisitorId = roleMap.get('User Visitor');
            const adminOrgchartId = roleMap.get('Admin Orgchart');
            const hrVisitorId = roleMap.get('Hr Visitor');
            
            const isExcludedFromDefaultUserVisitor = (fullEmail?.toLowerCase().includes('outsourced.sec') || existingUser.username?.toLowerCase().includes('outsourced.sec'));

            if (userVisitorId) {
                if (isExcludedFromDefaultUserVisitor) {
                    if (app_role_ids.includes(userVisitorId)) {
                        app_role_ids = app_role_ids.filter((id: string) => id !== userVisitorId);
                        updatedRoles = true;
                    }
                } else if (!app_role_ids.includes(userVisitorId)) {
                    app_role_ids.push(userVisitorId);
                    updatedRoles = true;
                }
            }
            if ((department === 'IDM Control' || department === 'Management' || existingUser.department === 'IDM Control' || existingUser.department === 'Management') && adminOrgchartId && !app_role_ids.includes(adminOrgchartId)) {
                app_role_ids.push(adminOrgchartId);
                updatedRoles = true;
            }
            if ((department === 'HR-TA' || department?.toUpperCase()?.includes('HR-TA') || existingUser.department === 'HR-TA' || existingUser.department?.toUpperCase()?.includes('HR-TA')) && hrVisitorId && !app_role_ids.includes(hrVisitorId)) {
                app_role_ids.push(hrVisitorId);
                updatedRoles = true;
            }
            
            // Update the existing user with new details if they are available from Graph API
            if (jobTitle || department || location || updatedRoles) {
              await pool.query(
                "UPDATE users SET job_title = COALESCE($1, job_title), department = COALESCE($2, department), location = COALESCE($3, location), app_role_ids = $4 WHERE id = $5",
                [jobTitle, department, location, app_role_ids, existingUser.id]
              );
            }

            user.id = existingUser.id.toString();
            (user as any).role = existingUser.role || "user";
            (user as any).orgchart_role = existingUser.orgchart_role || "user";
            (user as any).visitor_role = existingUser.visitor_role || "user";
            (user as any).app_role_ids = app_role_ids;
            user.email = existingUser.username;
          }
          
          if (userStatus === "Inactive") {
             console.log("[SSO Login Blocked] User is Inactive:", fullEmail);
             return false;
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
              "SELECT id, username, full_name, role, orgchart_role, visitor_role, job_title, department, location, app_role_ids FROM users WHERE LOWER(TRIM(username)) = LOWER($1) OR LOWER(TRIM(username)) = LOWER($2)", 
              [email, email.split('@')[0]]
            );

            if (result.rows.length > 0) {
              const dbUser = result.rows[0];
              token.id = dbUser.id.toString();
              token.role = dbUser.role || "user";
              token.orgchart_role = dbUser.orgchart_role || "user";
              token.visitor_role = dbUser.visitor_role || "user";
              token.app_role_ids = dbUser.app_role_ids || [];
              token.email = dbUser.username;
              token.name = dbUser.full_name || token.name; // Keep native token.name if full_name is empty
              token.jobTitle = dbUser.job_title;
              token.department = dbUser.department;
              token.location = dbUser.location;
              
              // Resolve allowed pages based on app_role_ids
              let allowedPages: string[] = [];
              let app_role_names: string[] = [];
              if (token.app_role_ids && (token.app_role_ids as string[]).length > 0) {
                 const rolesRes = await pool.query(
                   "SELECT name, permissions FROM app_roles WHERE id = ANY($1::uuid[])", 
                   [token.app_role_ids]
                 );
                 rolesRes.rows.forEach(r => {
                   if (r.name) app_role_names.push(r.name);
                   if (r.permissions && Array.isArray(r.permissions)) {
                     allowedPages.push(...r.permissions);
                   }
                 });
              }
              token.allowedPages = [...new Set(allowedPages)];
              token.app_role_names = app_role_names;

            } else {
              // Trường hợp hy hữu: User vừa đăng nhập thành công ở signIn nhưng DB chưa kịp cập nhật hoặc lỗi
              token.id = user.id;
              token.role = (user as any).role || "user";
              token.orgchart_role = (user as any).orgchart_role || "user";
              token.visitor_role = (user as any).visitor_role || "user";
              token.app_role_ids = (user as any).app_role_ids || [];
              token.allowedPages = [];
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
        (session.user as any).visitor_role = token.visitor_role as string;
        (session.user as any).app_role_ids = token.app_role_ids as string[];
        (session.user as any).app_role_names = token.app_role_names as string[];
        (session.user as any).allowedPages = token.allowedPages as string[];
        (session.user as any).email = token.email as string;
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
        app_roles: (session.user as any).app_role_ids,
        allowed_pages: (session.user as any).allowedPages
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
