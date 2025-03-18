import React from 'react';
import { cn } from '@/lib/utils';

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

const ChatDemo: React.FC = () => {
  return (
    <div className="bg-background rounded-2xl border">
      <div className="w-full max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-muted/80 p-4 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
            <h3 className="text-foreground font-semibold">Chat Room</h3>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {mockMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.isUser ? "flex-row-reverse" : ""
              )}
            >
              {message.avatar && (
                <img
                  src={message.avatar}
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
                  Mar 19, 8:47 PM
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;