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

interface ChatMessage {
  id: string
  sender: string
  message: string
  room: string
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
    socket.auth = {
      room: groupId
    }
    return socket.connect()
  }, [groupId])

  // Load messages from local storage on initial render
  useEffect(() => {
    const storedMessages = localStorage.getItem(`chat-messages-${groupId}`)
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages))
      } catch (error) {
        console.error("Error parsing stored messages:", error)
      }
    }
  }, [groupId])

  useEffect(() => {
    // Handle receiving messages
    function onNewMessage(message: ChatMessage) {
      setMessages(prev => {
        const newMessages = [...prev, message]
        // Save to local storage
        localStorage.setItem(`chat-messages-${groupId}`, JSON.stringify(newMessages))
        return newMessages
      })
    }

    // Handle receiving initial messages
    function onFetchMessages(messages: ChatMessage[]) {
      setMessages(messages)
      // Save to local storage
      localStorage.setItem(`chat-messages-${groupId}`, JSON.stringify(messages))
    }

    // Register socket event listeners
    socket.on("new_message", onNewMessage)
    socket.on("fetch_messages", onFetchMessages)

    // Clean up on unmount
    return () => {
      socket.off("new_message", onNewMessage)
      socket.off("fetch_messages", onFetchMessages)
    }
  }, [socket, groupId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageText.trim() || !session?.user) return

    // Get user information
    const userEmail = session.user.email || 'unknown@example.com'


    // Create message to send
    const message = {
      message: messageText,
      room: groupId,
      sender: session.user.id as string,
      user: {
        email: userEmail,
        avatar: session.user.avatar
      }
    }

    // Send message
    socket.emit("send_message", message)
    setMessageText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Get initials from name or email
  const getInitials = (name: string, email: string) => {
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase()
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
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
                  </div>
                </ChatBubble>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
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