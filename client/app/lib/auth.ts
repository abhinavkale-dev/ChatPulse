import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import GoogleProvider from "next-auth/providers/google";
import { Session, User, Account, Profile } from "next-auth";
import { signInSchema, signUpSchema } from "./zod";
import { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";

interface FormModal {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthRecognise {
  id: string;
  email: string | null;
}

const prisma = new PrismaClient();

async function checkIfEmailUsedWithGoogle(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.password) {
    throw new Error("This email is registered with Google. Please sign in with Google");
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.image,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "johndoe@example.com" },
        password: { label: "Password", type: "password" },
        confirmPassword: { label: "Confirm Password", type: "password", optional: true },
      },

      async authorize(credentials: Record<"email" | "password" | "confirmPassword", string> | undefined): Promise<AuthRecognise | null> {
        
        if (!credentials) {
          throw new Error("Missing Credentials");
        }

        const { email, password, confirmPassword } = credentials;


        if (!email || !password) {
          throw new Error("Email and password are required");
        }


        await checkIfEmailUsedWithGoogle(email);


        if (confirmPassword) {
          signUpSchema.parse({ email, password, confirmPassword });
          const existingUser = await prisma.user.findUnique({ where: { email } });

          if (existingUser) {
            return null;
          }


          const hashedPassword = await bcrypt.hash(password, 10);

          const newUser = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
            },
          });
          return { id: newUser.id, email: newUser.email };
        } 
        
        else {
          signInSchema.parse({ email, password });
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            throw new Error("No user found. Please sign up first.");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password!);
        
          if (!isPasswordValid) {
            throw new Error("Invalid password.");
          }
          return { id: user.id, email: user.email };
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({ where: { email: user.email! } });
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email!,
                avatar: user.image,
              },
            });
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback", error);
          return `/auth/signin?error=Failed to create a user account`;
        }
      }
      return true;
    },
    async jwt({
      token,
      user,
      account,
      profile,
    }: {
      token: JWT;
      user?: User;
      account: Account | null;
      profile?: Profile | null;
    }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.avatar =
          user.avatar || (account?.provider === "google" && profile?.image ? profile.image : null);
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
};
