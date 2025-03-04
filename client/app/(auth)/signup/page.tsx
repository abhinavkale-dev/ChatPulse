"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signUpSchema } from "@/app/lib/zod";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

export function Signup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      toast.success("Welcome!", {
        description: "Successfully signed up"
      });
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }
  if (status === "authenticated") {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Signup Failed", {
          description: result.error
        });
      } else {
        toast.success("Welcome aboard!", {
          description: "Your account has been created successfully."
        });
        router.push("/");
      }
    } catch (error) {
      toast.error("Signup Failed", {
        description: "An unexpected error occurred. Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    signIn("google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Join Chat Pulse and start connecting
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your email" 
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Create a password" 
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Confirm your password" 
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-rose-500" />
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
            <div className="w-full border-t border-white/[0.08]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#030303] px-2 text-white/40">or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignup}
          className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
          type="button"
        >
          <FcGoogle className="mr-2 text-xl" />
          Sign up with Google
        </Button>

        <p className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link 
            href="/signin" 
            className="font-medium text-white hover:text-white/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
