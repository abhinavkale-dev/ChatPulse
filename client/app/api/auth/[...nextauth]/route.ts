import { authOptions } from "@/app/lib/auth";
import NextAuth from "next-auth/next";


const nexAuth = NextAuth(authOptions)
export {nexAuth as GET, nexAuth as POST}