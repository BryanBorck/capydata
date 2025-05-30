import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      walletAddress: string;
      username: string | null;
      profilePictureUrl: string | null;
      worldId: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    walletAddress: string;
    username: string | null;
    profilePictureUrl: string | null;
    worldId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    walletAddress: string;
    username: string | null;
    profilePictureUrl: string | null;
    worldId: string | null;
  }
}
