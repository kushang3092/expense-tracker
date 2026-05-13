import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

type BackendAuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    provider?: string;
  };
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as BackendAuthResponse;

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          image: data.user.avatar || undefined,
          accessToken: data.token,
          provider: data.user.provider || "local",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
        token.userId = user.id;
        token.provider = user.provider;
      }

      if (account?.provider === "google" && profile?.email) {
        try {
          const response = await fetch(`${apiUrl}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user?.name || profile.name,
              email: profile.email,
              avatar: user?.image,
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as BackendAuthResponse;
            token.accessToken = data.token;
            token.userId = data.user.id;
            token.provider = data.user.provider || "google";
          } else {
            console.error("Backend Google auth failed with status:", response.status);
          }
        } catch (error) {
          console.error("Failed to connect to backend for Google auth:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.provider = token.provider;
      }

      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

