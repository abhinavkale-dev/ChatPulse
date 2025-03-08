import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import { signInSchema, signUpSchema } from "./zod";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "johndoe@example.com" },
        password: { label: "Password", type: "password" },
        confirmPassword: { label: "Confirm Password", type: "password", optional: true },
      },

      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Missing credentials");
        }

        const { email, password, confirmPassword } = credentials;

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        // Signup flow
        if (confirmPassword) {
          signUpSchema.parse({ email, password, confirmPassword });
          
          const existingUser = await prisma.user.findUnique({ 
            where: { email } 
          });

          if (existingUser) {
            throw new Error("Email already in use");
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const newUser = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
            },
          });
          
          return newUser;
        } 
        // Login flow
        else {
          signInSchema.parse({ email, password });
          
          const user = await prisma.user.findUnique({ 
            where: { email } 
          });

          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
        
          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }
          
          return user;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
