import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Message = {
  id: number;
  email: string;
  text: string;
  avatar?: string;
  isUser?: boolean;
};

const mockMessages: Message[] = [
  {
    id: 1,
    email: 'alice@demo.com',
    text: 'Hi there!',
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
  {
    id: 2,
    email: 'munni@demo.com',
    text: 'Hello, how are you?',
    avatar: 'https://i.pravatar.cc/150?img=47',
    isUser: true,
  },
  {
    id: 3,
    email: 'alice@demo.com',
    text: "I'm good, thanks!",
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
  {
    id: 4,
    email: 'munni@demo.com',
    text: 'Great!',
    avatar: 'https://i.pravatar.cc/150?img=47',
    isUser: true,
  },
];

// Typing indicator component
const TypingIndicator: React.FC<{ isUser?: boolean; avatar?: string; email: string }> = ({ 
  isUser, 
  avatar, 
  email 
}) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : ""
      )}
    >
      {avatar && (
        <Image
          src={avatar}
          width={200}
          height={200}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      )}
      <div className="max-w-[75%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-primary">
            {email}
          </span>
        </div>

        <div className="rounded-2xl px-4 py-2 text-sm bg-muted text-foreground">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground mt-1">
          Just now
        </div>
      </div>
    </div>
  );
};

const ChatDemo: React.FC = () => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [typingInfo, setTypingInfo] = useState<{ isTyping: boolean; messageIndex: number }>({ 
    isTyping: false, 
    messageIndex: 0 
  });
  const [resetDemo, setResetDemo] = useState(false);

  useEffect(() => {
    // Reset effect
    if (resetDemo) {
      setVisibleMessages([]);
      setTypingInfo({ isTyping: false, messageIndex: 0 });
      setResetDemo(false);
      return;
    }

    // Initial delay before starting the demo
    const initialDelay = setTimeout(() => {
      if (mockMessages.length > 0 && visibleMessages.length === 0) {
        setVisibleMessages([mockMessages[0]]);
        setTypingInfo({ isTyping: true, messageIndex: 1 });
      }
    }, 1000);

    return () => clearTimeout(initialDelay);
  }, [resetDemo]);

  useEffect(() => {
    // Handle typing animation and message display
    if (typingInfo.isTyping && typingInfo.messageIndex < mockMessages.length) {
      const typingTimer = setTimeout(() => {
        // Stop typing and show the next message
        setTypingInfo({ isTyping: false, messageIndex: typingInfo.messageIndex });
        setVisibleMessages(prev => [...prev, mockMessages[typingInfo.messageIndex]]);
        
        // Set up the next person to type after a short pause
        const nextTypingTimer = setTimeout(() => {
          if (typingInfo.messageIndex + 1 < mockMessages.length) {
            setTypingInfo({ 
              isTyping: true, 
              messageIndex: typingInfo.messageIndex + 1 
            });
          } else {
            // All messages shown, reset after a long delay
            const resetTimer = setTimeout(() => {
              setResetDemo(true);
            }, 5000);
            return () => clearTimeout(resetTimer);
          }
        }, 1000);
        
        return () => clearTimeout(nextTypingTimer);
      }, 2000);
      
      return () => clearTimeout(typingTimer);
    }
  }, [typingInfo, visibleMessages]);

  // Get current date-time for messages
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="bg-background rounded-2xl border">
      <div className="w-full max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-muted/80 p-4 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
            <h3 className="text-foreground font-semibold">Chat Room</h3>
          </div>
        </div>

        <div className="p-4 space-y-4" style={{ minHeight: '300px' }}>
          {visibleMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.isUser ? "flex-row-reverse" : ""
              )}
            >
              {message.avatar && (
                <Image
                  src={message.avatar}
                  width={200}
                  height={200}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div className="max-w-[75%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">
                    {message.email}
                  </span>
                </div>

                <div className="rounded-2xl px-4 py-2 text-sm bg-muted text-foreground">
                  {message.text}
                </div>

                <div className="text-[10px] text-muted-foreground mt-1">
                  {getCurrentTime()}
                </div>
              </div>
            </div>
          ))}
          
          {typingInfo.isTyping && typingInfo.messageIndex < mockMessages.length && (
            <TypingIndicator 
              isUser={mockMessages[typingInfo.messageIndex].isUser}
              avatar={mockMessages[typingInfo.messageIndex].avatar}
              email={mockMessages[typingInfo.messageIndex].email}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;