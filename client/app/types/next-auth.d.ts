import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    avatar?: string | null;
  }

  interface Session {
    user: {
      id?: string | null;
      email?: string | null;
      avatar?: string | null;
    };
  }

  interface Profile {
    picture?: string; 
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string | null;
    email?: string | null;
    avatar?: string | null;
  }
} 