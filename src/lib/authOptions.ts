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
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [credentials.username]);

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) return null;

        return {
          id: user.id.toString(),
          name: user.full_name || user.username,
          email: user.username,
          role: user.role || "user",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "azure-ad") {
        const pool = await getDbConnection();
        const email = user.email || profile?.preferred_username || profile?.upn;
        const name = user.name || profile?.name || email;
        
        if (!email) return false;

        // Ensure user exists in DB
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [email]);
        if (result.rows.length === 0) {
          const dummyPassword = "sso_user_no_password_" + Math.random().toString(36).substring(7);
          const insertResult = await pool.query(
              "INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *",
              [email, dummyPassword, name, "user"]
          );
          const newUser = insertResult.rows[0];
          user.id = newUser.id.toString();
          (user as any).role = newUser.role;
        } else {
          const existingUser = result.rows[0];
          user.id = existingUser.id.toString();
          (user as any).role = existingUser.role || "user";
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
        token.username = user.email || user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
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
