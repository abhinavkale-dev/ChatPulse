"use client";

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ExtendedUser {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession() as { data: { user: ExtendedUser } | null, status: string };
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push("/signin");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="mb-6 hover:bg-primary/10 hover:text-white gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {session.user.avatar && (
              <Image
                width={200}
                height={200}
                src={session.user.avatar}
                alt={`${session.user.email}'s avatar`}
                className="h-32 w-32 rounded-full object-cover border border-base-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "/avatar.png";
                }}
              />
            )}
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {session.user.name?? "User"}
              </h2>
              <p className="text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="outline"
              className="w-full max-w-[200px] border-red-500 hover:bg-red-500 hover:text-white text-white bg-red-500/80"
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 