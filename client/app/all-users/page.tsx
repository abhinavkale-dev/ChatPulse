"use client"

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

const fetchUsers = async () => {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });


  const UserSkeleton = () => (
    <Card className="overflow-hidden w-full">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            <Skeleton className="h-4 sm:h-5 w-24 sm:w-36" />
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-3 pt-14 md:pt-3 sm:p-6 w-full">
       <Button
        onClick={() => router.back()}
        variant="ghost"
        className="mb-6 hover:bg-amber-500 hover:text-white gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Welcome to ChatPulse</h1>
      
      <section className="w-full">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Connect with Users</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
            {[...Array(12)].map((_, index) => (
              <UserSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg p-4 sm:p-6 text-center w-full">
            <p className="text-red-600">Error loading users. Please try again later.</p>
          </div>
        ) : data?.users?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
            {data.users
              .filter((user: User) => user.id !== session?.user?.id)
              .map((user: User) => (
                <Card key={user.id} className="overflow-hidden w-full">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border border-base-300">
                        {user.avatar ? (
                          <AvatarImage 
                            src={user.avatar} 
                            alt={`${user.email}'s avatar`} 
                          />
                        ) : (
                          <AvatarImage src="/avatar.png" alt="Default avatar" />
                        )}
                        <AvatarFallback className="bg-primary text-primary-content">
                          {user.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-base sm:text-lg font-medium truncate">
                          {(user.email ? user.email.split('@')[0] : 'Anonymous User')}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center w-full">
            <p className="text-gray-600">No other users found. Invite your friends to join!</p>
          </div>
        )}
      </section>
    </div>
  );
}