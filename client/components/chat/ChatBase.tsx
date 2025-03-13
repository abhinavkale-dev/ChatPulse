"use client"

import { getSocket } from "@/app/lib/socket.config"
import { useEffect, useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage 
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { format } from "date-fns"

interface ChatMessage {
  id: string
  sender: string
  message: string
  room: string
  createdAt: string // ISO string date
  user: {
    email: string
    avatar?: string
  }
}

export default function ChatBase({ groupId }: { groupId: string }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const socket = useMemo(() => {
    const socket = getSocket()
    socket.auth = { room: groupId }
    return socket.connect()
  }, [groupId])

  useEffect(() => {
    // When receiving a new message, append it to the list.
    function onNewMessage(message: ChatMessage) {
      setMessages(prev => [...prev, message])
    }

    // When initially fetching messages, set them in state.
    function onFetchMessages(fetchedMessages: ChatMessage[]) {
      setMessages(fetchedMessages)
    }

    socket.on("new_message", onNewMessage)
    socket.on("fetch_messages", onFetchMessages)

    return () => {
      socket.off("new_message", onNewMessage)
      socket.off("fetch_messages", onFetchMessages)
    }
  }, [socket, groupId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageText.trim() || !session?.user) return

    const userEmail = session.user.email || 'unknown@example.com'

    const message = {
      message: messageText,
      room: groupId,
      sender: session.user.id as string,
      user: {
        email: userEmail,
        avatar: session.user.avatar
      },
      createdAt: new Date().toISOString()
    }

    socket.emit("send_message", message)
    setMessageText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Format message timestamp - simplified version
  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return format(date, "MMM d, h:mm a");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages display */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender === (session?.user?.id as string)
              return (
                <ChatBubble 
                  key={message.id} 
                  variant={isOwn ? "sent" : "received"}
                >
                  {!isOwn && (
                    <ChatBubbleAvatar 
                      src={message.user.avatar || "/avatar.png"} 
                      fallback={message.user.email.charAt(0).toUpperCase()}
                    />
                  )}
                  <div className="flex flex-col">
                    {!isOwn && (
                      <span className="text-xs text-gray-500 mb-1 ml-1">
                        {message.user.email}
                      </span>
                    )}
                    <ChatBubbleMessage variant={isOwn ? "sent" : "received"}>
                      {message.message}
                    </ChatBubbleMessage>
                    <span className={`text-xs text-gray-400 mt-1 ${isOwn ? "self-end" : "self-start"}`}>
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </ChatBubble>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <ChatInput
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={!messageText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}