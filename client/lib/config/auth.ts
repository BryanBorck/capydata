import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "worldcoin",
      name: "Worldcoin",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        username: { label: "Username", type: "text" },
        profilePictureUrl: { label: "Profile Picture URL", type: "text" },
        worldId: { label: "World ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress) {
          return null;
        }

        // Return the user object
        return {
          id: credentials.walletAddress,
          walletAddress: credentials.walletAddress,
          username: credentials.username || null,
          profilePictureUrl: credentials.profilePictureUrl || null,
          worldId: credentials.worldId || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
        token.worldId = user.worldId;
      }

      // Handle updates to the session
      if (trigger === "update" && session) {
        token.username = session.username;
        token.profilePictureUrl = session.profilePictureUrl;
        token.worldId = session.worldId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          walletAddress: token.walletAddress as string,
          username: token.username as string | null,
          profilePictureUrl: token.profilePictureUrl as string | null,
          worldId: token.worldId as string | null,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Custom sign-in page
  },
};
