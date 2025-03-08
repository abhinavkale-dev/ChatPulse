// app/chat/[id]/layout.tsx
"use client";

import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
// Tabler icons
import { IconLayoutDashboard, IconUser, IconSettings, IconLogout } from "@tabler/icons-react";
// Example logo
import Image from "next/image";
import { signOut } from "next-auth/react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Define the links you want in your sidebar
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconLayoutDashboard className="text-neutral-600 dark:text-neutral-300" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <IconUser className="text-neutral-600 dark:text-neutral-300" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="text-neutral-600 dark:text-neutral-300" />,
    },
    {
      label: "Logout",
      onClick: () => signOut({ callbackUrl: "/" }),
      icon: <IconLogout className="text-neutral-600 dark:text-neutral-300 cursor-pointer" />,
    },
  ];

  return (
    <div className="flex min-h-screen h-screen bg-neutral-900 text-white">

      <Sidebar>
        <SidebarBody className="relative flex flex-col h-full">

          <div className="flex items-center justify-start mb-4 gap-2">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Acet Labs"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-semibold">Acet Labs</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 mt-8">
            {links.map((link, index) => (
              <SidebarLink 
                key={link.label || `link-${index}`} 
                link={link} 
              />
            ))}
          </nav>

          {/* Bottom Profile Section - push to bottom with mt-auto */}
          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2 mb-4">
    
              <Image
                src="/avatar.jpg"
                alt="Manu Arora"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <span className="font-medium">Manu Arora</span>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Chat Content */}
      <div className="flex-1 p-4 overflow-auto">{children}</div>
    </div>
  );
}
