
import React from 'react';
import ChatDemo from './ChatDemo';
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import Header from './Header';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatedShinyText } from '../magicui/animated-shiny-text';
import { BentoGrid } from './BentoGrid';

const Hero: React.FC = () => {
  const router = useRouter();
  return (
    <div>
    <section className="relative pt-32 pb-24 md:pt-34 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-3/4 h-1/2 bg-gradient-to-tr from-primary/10 to-transparent opacity-60 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-accent/10 to-transparent opacity-60 blur-[120px] rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-y-16 gap-x-8">
          <div className="flex-1 text-center lg:text-left">
            
            <div className="inline-block items-center rounded-full px-3 py-1 mb-6 text-xs font-medium border bg-primary/4 text-primary">
              <span className="mr-1">✨</span> <AnimatedShinyText>Introducing ChatPulse</AnimatedShinyText>
            </div>
            
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground">
              Connect with anyone,<br /> anywhere in real-time
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Create private chat rooms for friends, teammates, or communities. Share ideas, collaborate, and connect with seamless real-time messaging.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <InteractiveHoverButton onClick={() => router.push('/signin')}>Get Started</InteractiveHoverButton>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md mx-auto lg:mx-0 floating">
            <ChatDemo />
          </div>
        </div>
      </div>
    </section>

    <div className="container mx-auto">
    <div className="h-[50vh]">
    <BentoGrid />
    </div>
    </div>
    </div>
  );
};

export default Hero;