"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { UserRoundSearch, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

type ExtendedUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const [toastShown, setToastShown] = useState(false);
  
  const user = session?.user as ExtendedUser;
  
  useEffect(() => {
    if (status === "authenticated" && user?.name && !toastShown) {
      toast.success(`Welcome, ${user.name}!`, {
        id: "auth-toast"
      });
      
      setToastShown(true);
    }
  }, [status, user, toastShown]);
  
  const handleLogout = async () => {
    toast.promise(
      signOut({ callbackUrl: "/" }),
      {
        loading: "Logging out...",
        success: "Successfully logged out!",
        error: "Failed to log out"
      }
    );
  };
  
  const links = [
    {
      label: "All Users",
      href: "/all-users",
      icon: (
        <UserRoundSearch className="text-neutral-700 dark:text-neutral-200 h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      onClick: handleLogout,
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-6 w-6 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-50 dark:bg-neutral-900">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-4">
              {links.map((link, index) => (
                <SidebarLink key={index} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: user?.name || user?.email?.split('@')[0] || "User Profile",
                href: "/profile",
                icon: (
                  <div className="relative">
                    <Avatar className="h-7 w-7 flex-shrink-0 border border-base-300">
                      {user?.avatar && (
                        <AvatarImage 
                          src={user.avatar}
                          alt={`${user?.email || "User"}'s avatar`}
                          onError={(e) => {
                            console.log("Avatar failed to load:", user?.avatar);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <AvatarFallback className="bg-primary text-primary-content">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      
      <div className="flex-1 overflow-y-auto p-4 w-full md:w-auto">
        {children}
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Acet Labs
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};
const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
        <div className="flex gap-2">
          {[...new Array(4)].map((i) => (
            <div
              key={"first-array" + i}
              className="h-20 w-full rounded-lg  bg-gray-100 dark:bg-neutral-800 animate-pulse"
            ></div>
          ))}
        </div>
        <div className="flex gap-2 flex-1">
          {[...new Array(2)].map((i) => (
            <div
              key={"second-array" + i}
              className="h-full w-full rounded-lg  bg-gray-100 dark:bg-neutral-800 animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
