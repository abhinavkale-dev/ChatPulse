import { authOptions } from "@/app/lib/auth";
import NextAuth from "next-auth/next";

// Create a simple handler without testing database connection
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };