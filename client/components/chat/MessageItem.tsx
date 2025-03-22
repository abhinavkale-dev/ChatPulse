"use client"

import * as React from "react"
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage 
} from "@/components/ui/chat-bubble"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ChatMessage } from "@/types/chat"
import Image from "next/image"

interface MessageItemProps {
  message: ChatMessage
  isOwn: boolean
  sessionUserAvatar?: string
}

export function MessageItem({ message, isOwn, sessionUserAvatar }: MessageItemProps) {
  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return format(date, "MMM d, h:mm a");
  };


  const isGifUrl = (url: string) => {
    return url.includes('tenor.com') || url.includes('giphy.com');
  }

  const renderMessageContent = (content: string) => {
    if (content.includes('http') && (content.includes('tenor.com') || content.includes('giphy.com'))) {
      const urlMatch = content.match(/(https?:\/\/[^\s]+)/i);
      
      if (urlMatch && isGifUrl(urlMatch[0])) {
        const gifUrl = urlMatch[0];

        const parts = content.split(gifUrl);
        const beforeText = parts[0];
        const afterText = parts[1] || '';
        
        if (!beforeText.trim() && !afterText.trim()) {
          return (
            <div className="flex justify-center items-center w-full overflow-hidden">
              <Image 
                width={200}
                height={200}
                src={gifUrl} 
                alt="GIF" 
                className="w-full h-auto rounded-md" 
                loading="lazy"
                style={{ 
                  minWidth: '220px',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: 0
                }}
              />
            </div>
          );
        }
        
        // If there's text and a GIF
        return (
          <>
            {beforeText}
            <div className="flex justify-center items-center w-full overflow-hidden my-1">
              <Image 
                width={200}
                height={200}
                src={gifUrl} 
                alt="GIF" 
                className="w-full h-auto rounded-md" 
                loading="lazy"
                style={{ 
                  minWidth: '220px',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: 0
                }}
              />
            </div>
            {afterText}
          </>
        );
      }
    }
    
    return content;
  };

  return (
    <ChatBubble variant={isOwn ? "sent" : "received"}>
      {!isOwn ? (
        <ChatBubbleAvatar 
          src={message.user?.avatar}
          className="h-10 w-10"
        />
      ) : (
        <ChatBubbleAvatar 
          className="h-10 w-10"
          src={sessionUserAvatar}
        />
      )}
      <div className={cn(
        "flex flex-col max-w-full",
        isOwn && "items-end"
      )}>
        <span className={cn(
          "text-xs text-muted-foreground mb-1",
          isOwn ? "mr-1" : "ml-1"
        )}>
          {message.user?.email || 'Unknown User'}
        </span>
        <ChatBubbleMessage variant={isOwn ? "sent" : "received"}>
          {renderMessageContent(message.message)}
        </ChatBubbleMessage>
        <span className={`text-xs text-muted-foreground mt-1 ${isOwn ? "self-end" : "self-start"}`}>
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </ChatBubble>
  )
}
