import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { signUpSchema, signInSchema } from "./zod";
import { Session, User, Account, Profile } from "next-auth";
import { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

interface FormCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthResponse {
  id: string;
  email: string | null;
  avatar?: string | null;
}

async function checkIfEmailUsedWithGoogle(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && !user.password) {
    throw new Error("This email is registered with Google. Please sign in with Google.");
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
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
      async authorize(credentials?: FormCredentials): Promise<AuthResponse | null> {
        if (!credentials) {
          throw new Error("Missing credentials");
        }

        const { email, password, confirmPassword } = credentials;

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        // Check if email is used with Google before proceeding
        await checkIfEmailUsedWithGoogle(email);

        if (confirmPassword) {
          // Signup Flow
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
              avatar: "/avatar.png",
            },
          });
          
          return { id: newUser.id, email: newUser.email, avatar: newUser.avatar };
        } else {
          // Signin Flow
          signInSchema.parse({ email, password });

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            throw new Error("No user found. Please sign up first.");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password!);
          if (!isPasswordValid) {
            throw new Error("Invalid password.");
          }

          // If user doesn't have an avatar, update their record with a default avatar
          if (!user.avatar) {
            const updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                avatar: "/avatar.png"
              }
            });
            
            return { id: updatedUser.id, email: updatedUser.email, avatar: updatedUser.avatar };
          }
          
          return { id: user.id, email: user.email, avatar: user.avatar };
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: User;
      account: Account | null;
    }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          
          // Fix for Google avatar URLs - remove size parameters
          let googleAvatarUrl = user.image || "";
          if (googleAvatarUrl.includes('googleusercontent.com')) {
            // Remove the size parameter if present
            googleAvatarUrl = googleAvatarUrl.split('=')[0];
          }
          
          if (!existingUser) {
            // Create user without password for Google sign-in
            await prisma.user.create({
              data: {
                email: user.email!,
                avatar: googleAvatarUrl,
                // No password for Google users
              }
            });
            
            return true; // Successfully created new user
          } else {
            // Update the existing user's avatar with the fixed Google avatar URL
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatar: googleAvatarUrl }
            });
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return `/auth/signin?error=Failed to create user account`;
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
      user?: User | null;
      account?: Account | null;
      profile?: Profile | null;
    }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        
        // Ensure Google avatars are properly formatted
        if (account?.provider === "google" && profile?.picture) {
          // Fix for Google avatar URLs - remove size parameters
          let googleAvatarUrl = profile.picture;
          
          // Remove any size parameters from Google URLs
          if (googleAvatarUrl.includes('googleusercontent.com')) {
            // Remove the size parameter if present
            googleAvatarUrl = googleAvatarUrl.split('=')[0];
          }
          
          token.avatar = googleAvatarUrl;
        } else {
          // For regular sign-ins, use the stored avatar
          token.avatar = user.avatar;
        }
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/signin',
    signOut: '/signout',
  },
};
