"use client";

import React from 'react';
import Link from 'next/link';
import { FaGithub, FaTwitter } from "react-icons/fa";
import { Card } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function Page() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 hover:bg-primary/10 hover:text-white gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Card className="p-6 shadow-lg rounded-lg transition transform hover:scale-105 max-w-2xl w-full">
        <div className="flex justify-center mb-6 w-full">
          <img 
            src="/naruto.webp" 
            alt="Naruto GIF" 
            className="rounded-lg w-full object-contain"
            style={{ minHeight: "250px" }}
          />
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-center">Connect With Me</h2>
        <div className="flex justify-center space-x-6">
          <Link 
            href="https://github.com/abhinavkale-dev" 
            target="_blank"
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <FaGithub className="h-6 w-6" />
            <span>GitHub</span>
          </Link>
          <Link 
            href="https://x.com/Abhinavstwt" 
            target="_blank"
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <FaTwitter className="h-6 w-6" />
            <span>Twitter</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default Page;