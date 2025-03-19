import React from 'react';
import ChatDemo from './ChatDemo';
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatedShinyText } from '../magicui/animated-shiny-text';
import { BentoGrid } from './BentoGrid';
import AccordionComp from '../ui/Minimal-accordion';

const Hero: React.FC = () => {
  const router = useRouter();
  return (
    <div>
      <section className="relative min-h-screen pt-32 pb-24 md:pt-50 md:pb-32 overflow-hidden">
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
              
              <h1 className="text-4xl sm:text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-zinc-400 via-zinc-200 to-[#fff] text-transparent bg-clip-text">
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

        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center">
          <svg 
            className="w-6 h-6 animate-bounce" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7"
            />
          </svg>
          <span className="mt-2 text-sm text-muted-foreground">Scroll Down</span>
        </div>
      </section>

      <section className="max-w-7xl mx-auto my-8 border-2 border-primary/40 rounded-lg bg-primary/6 pt-0 pb-24 md:pt-32 md:pb-32 overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl text-center mb-10 underline decoration-wavy font-extrabold">Features</h1>
            <p className="text-center mb-12 mx-auto text-lg">
              Empower your conversations with real-time chat, expressive media, <br /> secure public rooms, and a sleek, user-friendly interface.
            </p>
            <BentoGrid />
          </div>
        </div>
      </section>

      <section className="py-10">
        <div>
          <h1 className="text-center text-4xl underline decoration-wavy">FAQ</h1>
        </div>
      <AccordionComp />
      </section>

      
    </div>
  );
};

export default Hero;