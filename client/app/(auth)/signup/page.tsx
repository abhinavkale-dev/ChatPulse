"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signUpSchema } from "@/app/lib/zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import posthog from 'posthog-js';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Signup />
    </div>
  );
}

function Signup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    
    posthog.capture('signup_started', {
      method: 'credentials',
    });
  
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        redirect: false,
      });
  
      if (result?.error) {
        posthog.capture('signup_failed', {
          method: 'credentials',
          error: result.error,
        });
        
        toast.error("Signup Failed", {
          description: result.error
        });
        console.error("Signup error:", result.error);
      } else {
        posthog.capture('signup_successful', {
          method: 'credentials',
        });
        
        router.push("/home");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Signup Failed", {
        description: "An unexpected error occurred. Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    posthog.capture('signup_started', {
      method: 'google'
    });
    
    signIn("google", {
      callbackUrl: "/home"
    });
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card/20 p-6 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Join Chat Pulse today
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Email"
                    className="bg-background/50 border-border text-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Password"
                    type="password"
                    className="bg-background/50 border-border text-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Confirm Password"
                    type="password"
                    className="bg-background/50 border-border text-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Please wait...</span>
              </div>
            ) : (
              "Sign up"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-2 bg-background/50 hover:bg-background/80 text-foreground border border-border"
      >
        <FcGoogle className="h-5 w-5" />
        <span>Google</span>
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </div>
    </div>
  );
}
