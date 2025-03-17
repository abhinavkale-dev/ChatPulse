"use client"

import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { getSocket } from "@/app/lib/socket.config"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { ChatMessage } from "@/types/chat"

export function useChatQuery(groupId: string) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  const messagesLoaded = useRef(false)
  const MAX_MESSAGE_LENGTH = 500
  const queryClient = useQueryClient()
  
  // Create and configure socket
  const socket = useRef(getSocket())
  
  useEffect(() => {
    console.log(`Configuring socket for room: ${groupId}`)
    socket.current.auth = { room: groupId }
    
    if (!socket.current.connected) {
      console.log("Connecting socket...")
      socket.current.connect()
    }

    function onConnect() {
      console.log("Socket connected!")
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log("Socket disconnected!")
      setIsConnected(false)
    }

    socket.current.on("connect", onConnect)
    socket.current.on("disconnect", onDisconnect)

    return () => {
      socket.current.off("connect", onConnect)
      socket.current.off("disconnect", onDisconnect)
    }
  }, [groupId])

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

  // Set up socket event handlers
  useEffect(() => {
    // When receiving a new message, update the query cache
    function onNewMessage(message: ChatMessage) {
      console.log(`Received new message: ${message.id}`)
      queryClient.setQueryData(['messages', groupId], (oldData: ChatMessage[] | undefined) => {
        // Filter out any optimistic messages that might match this confirmed message
        const filteredMessages = oldData?.filter(m => 
          !(m.id.startsWith('optimistic-') && m.message === message.message && m.sender === message.sender)
        ) || []
        
        return [...filteredMessages, message]
      })
    }

    // When initially fetching messages, set them in the query cache
    function onFetchMessages(fetchedMessages: ChatMessage[]) {
      console.log(`Received ${fetchedMessages.length} messages from event`)
      if (!messagesLoaded.current) {
        queryClient.setQueryData(['messages', groupId], fetchedMessages)
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

    socket.current.on("new_message", onNewMessage)
    socket.current.on("fetch_messages", onFetchMessages)
    socket.current.on("error", onError)
    socket.current.on("moderation_event", onModerationEvent)

    return () => {
      socket.current.off("new_message", onNewMessage)
      socket.current.off("fetch_messages", onFetchMessages)
      socket.current.off("error", onError)
      socket.current.off("moderation_event", onModerationEvent)
    }
  }, [groupId, queryClient])

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      messagesLoaded.current = false
      if (socket.current.connected) {
        console.log("Disconnecting socket on cleanup")
        socket.current.disconnect()
      }
    }
  }, [])

  // Load messages when connected
  useEffect(() => {
    if (isConnected && !messagesLoaded.current) {
      console.log("Explicitly requesting messages from server")
      socket.current.emit("fetch_messages", { room: groupId }, (fetchedMessages: ChatMessage[]) => {
        console.log(`Received ${fetchedMessages.length} messages from callback`)
        queryClient.setQueryData(['messages', groupId], fetchedMessages)
        messagesLoaded.current = true
      })
    }
  }, [isConnected, groupId, queryClient])

  // Query for messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', groupId],
    queryFn: async () => {
      return [] as ChatMessage[]
    },
    initialData: [],
    enabled: false, // We'll manually manage this data with socket events
  })

  // Mutation for sending messages with optimistic updates
  const { mutate: sendMessage } = useMutation({
    mutationFn: async (messageText: string) => {
      if (!messageText.trim() || !session?.user) return null
      if (messageText.length > MAX_MESSAGE_LENGTH) return null

      const userEmail = session.user.email || 'unknown@example.com'

      const message = {
        message: messageText,
        room: groupId,
        sender: session.user.id as string,
        user: {
          email: userEmail,
          avatar: session.user.avatar || undefined
        }
      }

      return new Promise<void>((resolve) => {
        socket.current.emit("send_message", message)
        resolve()
      })
    },
    onMutate: async (messageText) => {
      if (!session?.user) return { previousMessages: [] }
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', groupId] })
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', groupId]) as ChatMessage[]
      
      // Create optimistic message
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${uuidv4()}`,
        message: messageText,
        room: groupId,
        sender: session.user.id as string,
        createdAt: new Date().toISOString(),
        user: {
          email: session.user.email || 'unknown@example.com',
          avatar: session.user.avatar || undefined
        }
      }
      
      // Optimistically update the UI
      queryClient.setQueryData(['messages', groupId], 
        (old: ChatMessage[] | undefined) => [...(old || []), optimisticMessage]
      )
      
      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      toast.error("Failed to send message")
      // Rollback to the previous state
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', groupId], context.previousMessages)
      }
    }
  })

  return {
    messages,
    isConnected,
    roomTitle,
    sendMessage,
    MAX_MESSAGE_LENGTH
  }
}
