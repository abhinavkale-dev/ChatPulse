"use client";
import { useState, useEffect, memo } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LogOut, Info, ScanFace } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ExtendedUser = {
  id?: string | null;
  name?: string | null;
  avatar?: string | null;
};

const ProfileAvatar = memo(({ user }: { user?: ExtendedUser }) => {
  
  return (
    <div className="relative">
      <Avatar className="h-7 w-7 flex-shrink-0 border border-base-300">
        {user?.avatar && (
          <AvatarImage 
            src={user.avatar}
            referrerPolicy="no-referrer"
          />
        )}
      </Avatar>
    </div>
  );
});
ProfileAvatar.displayName = 'ProfileAvatar';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const [toastShown, setToastShown] = useState(false);
  const router = useRouter();
  
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
      signOut({ 
        callbackUrl: "/",
        redirect: true
      }),
      {
        loading: "Logging out...",
        success: "Successfully logged out!",
        error: "Failed to log out"
      }
    );
  };
  
  const links = [
    {
      label: "Socials",
      href: "/socials",
      icon: (
        <ScanFace className="text-sidebar-foreground h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: "Info",
      href: "/info",
      icon: (
        <Info className="text-sidebar-foreground h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      onClick: handleLogout,
      icon: (
        <LogOut className="text-sidebar-foreground h-6 w-6 flex-shrink-0" />
      ),
    },
  ];

  useEffect(() => {
    if (status === "authenticated") {
      router.refresh();
    }
    
    let lastRefresh = Date.now();
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && 
          status === "authenticated" && 
          now - lastRefresh > 10000) {
        lastRefresh = now;
        router.refresh();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, router]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-background">
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
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
            <SidebarLink
              link={{
                label: user?.name || "User Profile",
                href: "/profile",
                icon: <ProfileAvatar key={user?.id || 'no-user'} user={user} />
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

const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-sidebar-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary dark:bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-sidebar-foreground whitespace-pre"
      >
        Chat Pulse
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-sidebar-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary dark:bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};
