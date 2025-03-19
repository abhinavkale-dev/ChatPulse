"use client"

import { getSocket } from "@/app/lib/socket.config"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ChatMessage } from "@/types/chat"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useChat(groupId: string) {
  // User session for authentication
  const { data: session } = useSession()
  
  // Basic state
  const [isConnected, setIsConnected] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  
  // Maximum message length
  const MAX_MESSAGE_LENGTH = 500
  
  // Socket connection
  const socket = useRef(getSocket())
  
  // TanStack Query setup
  const queryClient = useQueryClient()
  
  // Counter for generating unique IDs for optimistic updates
  const optimisticIdCounter = useRef(0)
  
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

  // Set up message handling with React Query
  const messagesQuery = useQuery({
    queryKey: ['messages', groupId],
    queryFn: async () => {
      return new Promise<ChatMessage[]>((resolve) => {
        socket.current.emit("fetch_messages", { room: groupId }, (fetchedMessages: ChatMessage[]) => {
          resolve(fetchedMessages)
        })
      })
    },
    enabled: isConnected,
  })

  // Simple error handler
  function onError(error: { type: string; message: string }) {
    toast.error("Message Error", {
      description: error.message,
    })
  }

  // Set up socket event listeners
  useEffect(() => {
    // Handle new incoming messages
    function onNewMessage(message: ChatMessage) {
      // Use a stable update pattern that's less prone to race conditions
      queryClient.setQueryData(['messages', groupId], (oldData: ChatMessage[] | undefined) => {
        if (!oldData) return [message]
        
        // Create a new array to avoid reference issues
        const newData = [...oldData]
        
        // Find any temporary message that matches this one
        const tempIndex = newData.findIndex(m => 
          m.id.startsWith('temp-') && 
          m.message === message.message && 
          m.sender === message.sender
        )
        
        // If we found a temporary message, replace it
        if (tempIndex !== -1) {
          newData[tempIndex] = message
          return newData
        }
        
        // If this is a completely new message, check if it already exists by ID
        const exists = newData.some(m => m.id === message.id)
        if (exists) return newData
        
        // Otherwise add it to the end
        return [...newData, message]
      })
    }

    // Add event listeners
    socket.current.on("new_message", onNewMessage)
    socket.current.on("error", onError)

    // Clean up event listeners
    return () => {
      socket.current.off("new_message", onNewMessage)
      socket.current.off("error", onError)
    }
  }, [groupId, queryClient])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket.current.connected) {
        socket.current.disconnect()
      }
    }
  }, [])

  // Mutation for sending messages with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
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

      return new Promise<void>((resolve, reject) => {
        socket.current.emit("send_message", message, (error: any) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
    },
    onMutate: async (messageText) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', groupId] })

      // Create optimistic message
      if (!session?.user) return
      const userEmail = session.user.email || 'unknown@example.com'
      
      // Generate a truly unique ID for the optimistic message
      const uniqueId = `temp-${Date.now()}-${optimisticIdCounter.current++}`
      
      const optimisticMessage: ChatMessage = {
        id: uniqueId,
        message: messageText,
        room: groupId,
        sender: session.user.id as string,
        createdAt: new Date().toISOString(),
        user: {
          email: userEmail,
          avatar: session.user.avatar || undefined
        }
      }

      // Add optimistic message to query data
      queryClient.setQueryData(['messages', groupId], (oldData: ChatMessage[] | undefined) => {
        return oldData ? [...oldData, optimisticMessage] : [optimisticMessage]
      })
    },
    onError: (error) => {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
      // Revert the optimistic update on error by refetching
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] })
    },
  })

  // Function to send a message (wrapper around the mutation)
  const sendMessage = (messageText: string) => {
    sendMessageMutation.mutate(messageText)
  }

  // Return everything needed by components
  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    isConnected,
    roomTitle,
    sendMessage,
    MAX_MESSAGE_LENGTH
  }
}
