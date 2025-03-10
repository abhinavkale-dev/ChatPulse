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

// Define the message type
interface Message {
  id: string
  sender: string
  senderEmail: string
  message: string
  avatar?: string
  timestamp: Date
}

export default function ChatBase({ groupId }: { groupId: string }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Establish socket connection
  const socket = useMemo(() => {
    const socket = getSocket()
    socket.auth = {
      room: groupId
    }
    return socket.connect()
  }, [groupId])

  // Handle receiving messages
  useEffect(() => {
    socket.on("message", (data: Message) => {
      console.log("Received message:", data)
      setMessages(prev => [...prev, {
        ...data,
        timestamp: new Date(data.timestamp || Date.now())
      }])
    })

    // Load previous messages
    socket.emit("get_messages", { room: groupId }, (response: Message[]) => {
      if (response && Array.isArray(response)) {
        setMessages(response.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp || Date.now())
        })))
      }
    })

    // Cleanup function
    return () => {
      socket.off("message")
      socket.close()
    }
  }, [socket, groupId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Send a message
  const sendMessage = () => {
    if (!inputMessage.trim() || !session?.user) return

    const messageData = {
      sender: session.user.name || "Anonymous",
      senderEmail: session.user.email || "anonymous@example.com",
      message: inputMessage,
      avatar: session.user.image || undefined,
      room: groupId,
      timestamp: new Date()
    }

    socket.emit("message", messageData)
    setInputMessage("")
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] w-full">
      {/* Messages container with overflow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.senderEmail === session?.user?.email
            
            return (
              <ChatBubble
                key={msg.id || index}
                variant={isCurrentUser ? "sent" : "received"}
                className={isCurrentUser ? "justify-end" : "justify-start"}
              >
                {!isCurrentUser && (
                  <ChatBubbleAvatar 
                    src={msg.avatar}
                    fallback={msg.senderEmail?.[0]?.toUpperCase() || "U"}
                  />
                )}
                
                <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                  <span className="text-xs text-muted-foreground mb-1">
                    {!isCurrentUser && `${msg.senderEmail} • `}
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </span>
                  
                  <ChatBubbleMessage variant={isCurrentUser ? "sent" : "received"}>
                    {msg.message}
                  </ChatBubbleMessage>
                </div>
                
                {isCurrentUser && (
                  <ChatBubbleAvatar 
                    src={session?.user?.image || undefined}
                    fallback={session?.user?.email?.[0]?.toUpperCase() || "U"}
                  />
                )}
              </ChatBubble>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-4 bg-background">
        <div className="flex items-center gap-2">
          <ChatInput
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
          />
          <Button 
            type="submit" 
            size="icon"
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}