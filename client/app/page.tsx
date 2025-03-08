'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/signin');
  };

  return (
      <Button onClick={handleGetStarted}>
        GET STARTED
      </Button>
  );
}
