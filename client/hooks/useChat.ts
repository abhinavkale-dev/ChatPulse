"use client"

import { getSocket } from "@/app/lib/socket.config"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ChatMessage } from "@/types/chat"

/**
 * Simple chat hook for handling messages in a chat room
 * @param groupId - The ID of the chat room
 */
export function useChat(groupId: string) {
  // User session for authentication
  const { data: session } = useSession()
  
  // Basic state
  const [isConnected, setIsConnected] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  // Track if messages have been loaded
  const messagesLoaded = useRef(false)
  
  // Maximum message length
  const MAX_MESSAGE_LENGTH = 500
  
  // Socket connection
  const socket = useRef(getSocket())
  
  // Set up socket connection
  useEffect(() => {
    // Set room ID in socket auth
    socket.current.auth = { room: groupId }
    
    // Connect socket if not connected
    if (!socket.current.connected) {
      socket.current.connect()
    }

    // Connection event handlers
    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    // Add event listeners
    socket.current.on("connect", onConnect)
    socket.current.on("disconnect", onDisconnect)

    // Clean up event listeners
    return () => {
      socket.current.off("connect", onConnect)
      socket.current.off("disconnect", onDisconnect)
    }
  }, [groupId])

  // Fetch room details
  useEffect(() => {
    async function fetchRoomDetails() {
      try {
        const res = await fetch(`/api/rooms/${groupId}`)
        if (res.ok) {
          const data = await res.json()
          setRoomTitle(data.room.title)
        }
      } catch (error) {
        // Silently handle errors
      }
    }
    
    fetchRoomDetails()
  }, [groupId])

  // Set up message handling
  useEffect(() => {
    // Handle new incoming messages
    function onNewMessage(message: ChatMessage) {
      setMessages(prev => [...prev, message])
    }

    // Handle initial message load
    function onFetchMessages(fetchedMessages: ChatMessage[]) {
      if (!messagesLoaded.current) {
        setMessages(fetchedMessages)
        messagesLoaded.current = true
      }
    }

    // Simple error handler
    function onError(error: { type: string; message: string }) {
      toast.error("Message Error", {
        description: error.message,
      })
    }

    // Add event listeners
    socket.current.on("new_message", onNewMessage)
    socket.current.on("fetch_messages", onFetchMessages)
    socket.current.on("error", onError)

    // Clean up event listeners
    return () => {
      socket.current.off("new_message", onNewMessage)
      socket.current.off("fetch_messages", onFetchMessages)
      socket.current.off("error", onError)
    }
  }, [groupId])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      messagesLoaded.current = false
      if (socket.current.connected) {
        socket.current.disconnect()
      }
    }
  }, [])

  // Load messages when connected
  useEffect(() => {
    if (isConnected && !messagesLoaded.current) {
      socket.current.emit("fetch_messages", { room: groupId }, (fetchedMessages: ChatMessage[]) => {
        setMessages(fetchedMessages)
        messagesLoaded.current = true
      })
    }
  }, [isConnected, groupId])

  // Function to send a message
  const sendMessage = (messageText: string) => {
    // Validate message
    if (!messageText.trim() || !session?.user) return
    if (messageText.length > MAX_MESSAGE_LENGTH) return

    // Get user email
    const userEmail = session.user.email || 'unknown@example.com'

    // Create message object
    const message = {
      message: messageText,
      room: groupId,
      sender: session.user.id as string,
      user: {
        email: userEmail,
        avatar: session.user.avatar || undefined
      }
    }

    // Send via socket
    socket.current.emit("send_message", message, (error: any) => {
      if (error) {
        toast.error("Failed to send message: " + error.message)
      }
    })
  }

  // Return everything needed by components
  return {
    messages,
    isConnected,
    roomTitle,
    sendMessage,
    MAX_MESSAGE_LENGTH
  }
}
