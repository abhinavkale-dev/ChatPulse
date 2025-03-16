"use client"

import { getSocket } from "@/app/lib/socket.config"
import { useEffect, useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage 
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import { Button } from "@/components/ui/button"
import { Send, Smile, ArrowLeft, Image } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import EmojiPicker, { Theme } from 'emoji-picker-react'
import GifPicker from 'gif-picker-react';


interface ChatMessage {
  id: string
  sender: string
  message: string
  room: string
  createdAt: string
  user: {
    email: string
    avatar?: string
  }
}

export default function ChatBase({ groupId }: { groupId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const MAX_MESSAGE_LENGTH = 500

  // Use a ref to track if messages have been loaded
  const messagesLoaded = useRef(false)

  // Fetch room details
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const res = await fetch(`/api/rooms/${groupId}`)
        if (!res.ok) throw new Error('Failed to fetch room details')
        const data = await res.json()
        setRoomTitle(data.room.title)
      } catch (error) {
        console.error('Error fetching room details:', error)
      }
    }
    fetchRoomDetails()
  }, [groupId])

  const socket = useMemo(() => {
    console.log(`Creating socket for room: ${groupId}`)
    const socket = getSocket()
    socket.auth = { room: groupId }
    return socket
  }, [groupId])

  // Handle socket connection
  useEffect(() => {
    if (!socket.connected) {
      console.log("Connecting socket...")
      socket.connect()
    }

    function onConnect() {
      console.log("Socket connected!")
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log("Socket disconnected!")
      setIsConnected(false)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
    }
  }, [socket])

  // Handle message loading once connected
  useEffect(() => {
    if (isConnected && !messagesLoaded.current) {
      console.log("Explicitly requesting messages from server")
      socket.emit("fetch_messages", { room: groupId }, (fetchedMessages: ChatMessage[]) => {
        console.log(`Received ${fetchedMessages.length} messages from callback`)
        setMessages(fetchedMessages)
        messagesLoaded.current = true
      })
    }
  }, [isConnected, groupId, socket])

  // Handle socket events
  useEffect(() => {
    // When receiving a new message, append it to the list.
    function onNewMessage(message: ChatMessage) {
      console.log(`Received new message: ${message.id}`)
      setMessages(prev => [...prev, message])
    }

    // When initially fetching messages, set them in state.
    function onFetchMessages(fetchedMessages: ChatMessage[]) {
      console.log(`Received ${fetchedMessages.length} messages from event`)
      if (!messagesLoaded.current) {
        setMessages(fetchedMessages)
        messagesLoaded.current = true
      }
    }

    // Handle rate limiting and other errors
    function onError(error: { type: string; message: string; retryAfter?: number }) {
      if (error.type === "RATE_LIMIT_EXCEEDED") {
        toast.error(error.message, {
          duration: 5000,
          icon: "🚫",
        });
      } else {
        // Handle other types of errors
        toast.error("An error occurred", {
          description: error.message,
        });
      }
    }

    // Handle moderation events such as when users are rate-limited
    function onModerationEvent(event: { type: string; user: string; message: string }) {
      if (event.type === "USER_RATE_LIMITED") {
        toast.info("Moderation Notice", {
          description: event.message,
          duration: 3000,
        });
      }
    }

    socket.on("new_message", onNewMessage)
    socket.on("fetch_messages", onFetchMessages)
    socket.on("error", onError)
    socket.on("moderation_event", onModerationEvent)

    return () => {
      socket.off("new_message", onNewMessage)
      socket.off("fetch_messages", onFetchMessages)
      socket.off("error", onError)
      socket.off("moderation_event", onModerationEvent)
    }
  }, [socket, groupId])

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      messagesLoaded.current = false
      if (socket.connected) {
        console.log("Disconnecting socket on cleanup")
        socket.disconnect()
      }
    }
  }, [socket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    // Limit input to 500 characters
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessageText(value)
    }
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !session?.user) return
    if (messageText.length > MAX_MESSAGE_LENGTH) return

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

    console.log(`Sending message to room: ${groupId}`)
    socket.emit("send_message", message)
    setMessageText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const onEmojiClick = (emojiObject: any) => {
    setMessageText((prevText) => prevText + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  // Format message timestamp - simplified version
  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return format(date, "MMM d, h:mm a");
  };

  // Simple function to check if a message contains a GIF URL
  const isGifUrl = (url: string) => {
    // Basic check for common GIF platforms
    return url.includes('tenor.com') || url.includes('giphy.com');
  }

  // Render message content with GIF support
  const renderMessageContent = (content: string) => {
    // Simple check for URL pattern
    if (content.includes('http') && (content.includes('tenor.com') || content.includes('giphy.com'))) {
      // Extract URL using a simple regex
      const urlMatch = content.match(/(https?:\/\/[^\s]+)/i);
      
      if (urlMatch && isGifUrl(urlMatch[0])) {
        const gifUrl = urlMatch[0];
        
        // Split text around the GIF URL
        const parts = content.split(gifUrl);
        const beforeText = parts[0];
        const afterText = parts[1] || '';
        
        // If there's only a GIF with no text, display just the GIF with no padding
        if (!beforeText.trim() && !afterText.trim()) {
          return (
            <div className="flex justify-center items-center w-full overflow-hidden p-2">
              <img 
                src={gifUrl} 
                alt="GIF" 
                className="w-full h-auto rounded-lg" 
                loading="lazy"
                style={{ 
                  minWidth: '250px',
                  maxHeight: '350px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
          );
        }
        
        // If there's text and a GIF
        return (
          <>
            {beforeText}
            <div className="flex justify-center items-center w-full overflow-hidden p-2 my-1">
              <img 
                src={gifUrl} 
                alt="GIF" 
                className="w-full h-auto rounded-lg" 
                loading="lazy"
                style={{ 
                  minWidth: '250px',
                  maxHeight: '350px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            {afterText}
          </>
        );
      }
    }
    
    // If no GIF URL found, just return the original content
    return content;
  };

  return (
    <div className="flex flex-col h-full overflow-x-hidden overflow-y-hidden">
      {/* Chat Header */}
      <div className="border-b border-border p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">{roomTitle || "Loading..."}</h1>
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} title={isConnected ? "Connected" : "Disconnected"} />
          </div>
        </div>
      </div>
      {/* Chat messages display */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-2 mb-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <div className="space-y-4 max-w-full">
            {messages.map((message) => {
              const isOwn = message.sender === (session?.user?.id as string)
              return (
                <ChatBubble 
                  key={message.id} 
                  variant={isOwn ? "sent" : "received"}
                >
                  {!isOwn ? (
                    <ChatBubbleAvatar 
                      src={message.user.avatar || "/avatar.png"}
                      className="h-10 w-10"
                      fallback={message.user.email ? message.user.email.substring(0, 1).toUpperCase() : "U"}
                    />
                  ) : (
                    <ChatBubbleAvatar 
                      className="h-10 w-10"
                      src={session?.user?.avatar || "/avatar.png"} 
                      fallback={session?.user?.email ? session.user.email.substring(0, 1).toUpperCase() : "U"}
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
                      {message.user.email}
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
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat input area */}
      <div className="border-t border-border p-4 sticky bottom-0 bg-background z-10">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <ChatInput
                value={messageText}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 pl-20 min-h-0 overflow-hidden"
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker)
                    setShowGifPicker(false)
                  }}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setShowGifPicker(!showGifPicker)
                    setShowEmojiPicker(false)
                  }}
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK}/>
                </div>
              )}
              {showGifPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg p-0 w-[280px] h-[380px] overflow-hidden shadow-lg z-50">
                  <div className="text-sm h-full">
                    {/* Simple GIF picker with minimal configuration */}
                    <GifPicker 
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ''} 
                      onGifClick={(gif) => {
                        // Add the selected GIF URL to the message text without extra spaces
                        setMessageText(gif.url) // Just set the URL as the message
                        setShowGifPicker(false) // Close the picker after selection
                      }}
                      width={280} // Slightly reduced width to ensure it fits
                      height={380} // Slightly reduced height
                      theme={Theme.DARK} // Match app's dark theme
                    />
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={handleSendMessage} 
              size="icon" 
              disabled={!messageText.trim() || messageText.length > MAX_MESSAGE_LENGTH}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {messageText.length}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>
      </div>
    </div>
  )
}