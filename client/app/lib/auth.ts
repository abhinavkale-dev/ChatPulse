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
        try {
          console.log("Auth: Starting authorize function");
          
          if (!credentials) {
            console.log("Auth: Missing credentials");
            throw new Error("Missing credentials");
          }

          const { email, password, confirmPassword } = credentials;
          console.log("Auth: Received credentials for", { email, hasPassword: !!password, hasConfirmPassword: !!confirmPassword });

          if (!email || !password) {
            console.log("Auth: Email or password missing");
            throw new Error("Email and password are required.");
          }

          try {
            await checkIfEmailUsedWithGoogle(email);
            console.log("Auth: Email not used with Google");
          } catch (error: any) {
            console.error("Auth: Google email check failed:", error.message);
            throw error;
          }

          if (confirmPassword) {
            console.log("Auth: Processing signup request", { email });
            // This is a signup request
            try {
              signUpSchema.parse({ email, password, confirmPassword });
              console.log("Auth: Signup schema validation passed");
            } catch (error: any) {
              console.error("Auth: Signup schema validation failed:", error);
              throw error;
            }

            try {
              const existingUser = await prisma.user.findUnique({ where: { email } });
              if (existingUser) {
                console.log("Auth: Email already registered");
                throw new Error("Email already registered. Please use a different email or sign in.");
              }
              console.log("Auth: Email not registered, proceeding with signup");
            } catch (error: any) {
              if (error.message.includes("already registered")) {
                throw error;
              }
              console.error("Auth: Database error checking existing user:", error);
              throw new Error("Database error. Please try again later.");
            }

            try {
              const hashedPassword = await bcrypt.hash(password, 10);
              console.log("Auth: Password hashed successfully");

              const newUser = await prisma.user.create({
                data: {
                  email,
                  password: hashedPassword,
                  avatar: "/avatar.png",
                },
              });
              console.log("Auth: New user created successfully", { userId: newUser.id });
              
              return { id: newUser.id, email: newUser.email, avatar: newUser.avatar };
            } catch (error: any) {
              console.error("Auth: Error creating new user:", error);
              throw new Error("Failed to create account. Please try again later.");
            }
          } else {
            console.log("Auth: Processing signin request", { email });

            try {
              signInSchema.parse({ email, password });
              console.log("Auth: Signin schema validation passed");
            } catch (error: any) {
              console.error("Auth: Signin schema validation failed:", error);
              throw error;
            }

            let user;
            try {
              user = await prisma.user.findUnique({ where: { email } });
              if (!user) {
                console.log("Auth: No user found with email", { email });
                throw new Error("No user found. Please sign up first.");
              }
              console.log("Auth: User found", { userId: user.id, hasPassword: !!user.password });
            } catch (error: any) {
              if (error.message.includes("No user found")) {
                throw error;
              }
              console.error("Auth: Database error finding user:", error);
              throw new Error("Database error. Please try again later.");
            }

            try {
              if (!user.password) {
                console.log("Auth: User has no password set (likely Google auth)");
                throw new Error("This account doesn't have a password. Please sign in with Google.");
              }
              
              const isPasswordValid = await bcrypt.compare(password, user.password);
              if (!isPasswordValid) {
                console.log("Auth: Invalid password");
                throw new Error("Invalid password.");
              }
              console.log("Auth: Password validation successful");
            } catch (error: any) {
              if (error.message.includes("Invalid password") || 
                  error.message.includes("doesn't have a password")) {
                throw error;
              }
              console.error("Auth: Error validating password:", error);
              throw new Error("Authentication error. Please try again later.");
            }

            try {
              if (!user.avatar) {
                console.log("Auth: User has no avatar, adding default");
                const updatedUser = await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    avatar: "/avatar.png"
                  }
                });
                console.log("Auth: User updated with default avatar");
                return { id: updatedUser.id, email: updatedUser.email, avatar: updatedUser.avatar };
              }
              
              console.log("Auth: Login successful", { userId: user.id });
              return { id: user.id, email: user.email, avatar: user.avatar };
            } catch (error: any) {
              console.error("Auth: Error updating user avatar:", error);
              // Still allow login even if avatar update fails
              return { id: user.id, email: user.email, avatar: user.avatar || "/avatar.png" };
            }
          }
        } catch (error: any) {
          console.error("Auth: Final error in authorize function:", { 
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          throw error;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

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
          
          const googleAvatarUrl = user.image || "";
          
          if (!existingUser) {

            await prisma.user.create({
              data: {
                email: user.email!,
                avatar: googleAvatarUrl,
    
              }
            });
            
            return true;
          } else {

            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatar: googleAvatarUrl }
            });
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
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
        

        if (account?.provider === "google" && profile?.picture) {
          token.avatar = profile.picture;
        } else {
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
    
    async redirect({ url, baseUrl }: { url?: string; baseUrl: string }) {
      return url || `${baseUrl}/home`;
    },
  },
  
  pages: {
    signIn: '/signin',
    signOut: '/signout',
  },
};
