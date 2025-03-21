"use client"

import { useRef, useEffect } from "react"
import { MessageItem } from "./MessageItem"
import { useSession } from "next-auth/react"
import { ChatMessage } from "@/types/chat"

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-2 mb-0">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start a conversation!
        </div>
      ) : (
        <div className="space-y-4 max-w-full">
          {messages.map((message) => {
            if (!message || !message.id) return null
            
            const isOwn = message.sender === (session?.user?.id as string)
            return (
              <MessageItem 
                key={message.id}
                message={message}
                isOwn={isOwn}
                sessionUserAvatar={session?.user?.avatar as string}
              />
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}
