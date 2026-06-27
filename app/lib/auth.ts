import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";

export const authOptions: NextAuthOptions = {
  // No adapter. We sync Google users manually in the JWT callback.
  // Credentials provider only works with JWT sessions.
  session: {
    strategy: "jwt",
  },

  // Redirect OAuth errors back to /signin so the user sees a clean page
  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  // Extra logging in development to debug OAuth issues
  debug: process.env.NODE_ENV === "development",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        email: {
          label: "Email",
          type: "text",
          placeholder: "example@gmail.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Credentials users are looked up by `credentialsEmail`, NOT `email`.
        // This keeps Google and credentials accounts completely separate.
        const user = await prisma.user.findUnique({
          where: { credentialsEmail: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.credentialsEmail,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      // Log details that help debug Google OAuth issues
      if (account?.provider === "google") {
        console.log("[Google signIn] providerAccountId:", account.providerAccountId);
        console.log("[Google signIn] profile email:", profile?.email);
      }
      return true;
    },

    async jwt({ token, account, profile, user }) {
      // Initial sign in
      if (account && profile) {
        if (account.provider === "google") {
          const googleId = account.providerAccountId;
          const email = profile.email;

          // Google profile uses `picture`; NextAuth normalized profile uses `image`.
          const image =
            (profile as { picture?: string }).picture || profile.image;

          if (!googleId) {
            throw new Error("Google providerAccountId is missing");
          }

          // Look for an existing Google user by googleId or email+googleId.
          // We don't match by email alone so we never accidentally link a
          // credentials user with the same address.
          const existingByGoogleId = await prisma.user.findUnique({
            where: { googleId },
          });

          let dbUser = existingByGoogleId;

          if (!dbUser && email) {
            dbUser = await prisma.user.findFirst({
              where: { email, googleId: { not: null } },
            });
          }

          if (!dbUser && email) {
            dbUser = await prisma.user.create({
              data: {
                googleId,
                email,
                name: profile.name,
                image,
              },
            });
          }

          if (!dbUser) {
            throw new Error(
              "Could not create or find Google user. Email may be missing."
            );
          }

          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }

      // For credentials sign in, `authorize` already returned our DB user id.
      if (!token.id && user?.id) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      // Only expose user data if we have a valid internal user id.
      // This prevents stale/invalid JWTs from being treated as authenticated.
      if (token.id) {
        session.user = {
          ...session.user,
          id: token.id as string,
        };
      } else {
        session.user = { id: "" };
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
