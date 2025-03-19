"use client";

import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function About() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="mb-6 hover:bg-primary/20 hover:text-white gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border rounded-lg shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">About ChatPulse</h1>
            <p className="text-muted-foreground text-lg">
              A casual project
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Project Goals</h2>
              <p className="text-muted-foreground">
                ChatPulse helped me in learning :
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Optimistic updates (Tanstack Query)",
                  "Socket IO",
                  "Redis (caching, rate limiting)"
                ].map((tech) => (
                  <Badge 
                    key={tech}
                    variant="secondary"
                    className="text-sm py-2 px-4 hover:bg-primary/10 hover:text-white"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>


            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  "Socket IO",
                  "Redis",
                  "Next.js 15",
                  "TypeScript",
                  "TanStack Query",
                  "Tailwind CSS",
                  "Shadcn UI",
                  "NextAuth.js"
                ].map((tech) => (
                  <Badge 
                    key={tech}
                    variant="secondary"
                    className="text-sm py-2 px-4 hover:bg-primary/10 hover:text-white"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}