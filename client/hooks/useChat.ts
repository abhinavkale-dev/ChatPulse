"use client"

import { getSocket } from "@/app/lib/socket.config"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ChatMessage } from "@/types/chat"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import posthog from 'posthog-js'

export function useChat(groupId: string) {

  const { data: session } = useSession()
  
  const [isConnected, setIsConnected] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  
  const MAX_MESSAGE_LENGTH = 500
  
  const socket = useRef(getSocket())
  
  const queryClient = useQueryClient()
  
  const optimisticIdCounter = useRef(0)
  
  useEffect(() => {
    socket.current.auth = { room: groupId }
    
    if (!socket.current.connected) {
      socket.current.connect()
    }

    function onConnect() {
      setIsConnected(true)
      posthog.capture('room_joined', {
        room_id: groupId,
      })
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    socket.current.on("connect", onConnect)
    socket.current.on("disconnect", onDisconnect)

    return () => {
      socket.current.off("connect", onConnect)
      socket.current.off("disconnect", onDisconnect)
    }
  }, [groupId])

  useEffect(() => {
    async function fetchRoomDetails() {
      try {
        const res = await fetch(`/api/rooms/${groupId}`)
        if (res.ok) {
          const data = await res.json()
          setRoomTitle(data.room.title)
        }
      } catch(error) {
        console.error("Failed to fetch room details:", error)
      }
    }
    
    fetchRoomDetails()
  }, [groupId])

  const messagesQuery = useQuery({
    queryKey: ['messages', groupId],
    queryFn: async () => {
      return new Promise<ChatMessage[]>((resolve) => {
        socket.current.emit("fetch_messages", { room: groupId }, (fetchedMessages: ChatMessage[]) => {
          posthog.capture('messages_loaded', {
            room_id: groupId,
            message_count: fetchedMessages.length
          })
          resolve(fetchedMessages)
        })
      })
    },
    enabled: isConnected,
  })

  function onError(error: { type: string; message: string }) {
    toast.error("Message Error", {
      description: error.message,
    })
  }

  useEffect(() => {
    function onNewMessage(message: ChatMessage) {
      queryClient.setQueryData(['messages', groupId], (oldData: ChatMessage[] | undefined) => {
        if (!oldData) return [message]
        
        const newData = [...oldData]
        
        const tempIndex = newData.findIndex(m => 
          m.id.startsWith('temp-') && 
          m.message === message.message && 
          m.sender === message.sender
        )
        
        if (tempIndex !== -1) {
          newData[tempIndex] = message
          return newData
        }
        
        const exists = newData.some(m => m.id === message.id)
        if (exists) return newData
        
        return [...newData, message]
      })
    }

    socket.current.on("new_message", onNewMessage)
    socket.current.on("error", onError)

    return () => {
      socket.current.off("new_message", onNewMessage)
      socket.current.off("error", onError)
    }
  }, [groupId, queryClient])

  useEffect(() => {
    return () => {
      if (socket.current.connected) {
        socket.current.disconnect()
      }
    }
  }, [])

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!messageText.trim() || !session?.user) return
      if (messageText.length > MAX_MESSAGE_LENGTH) return

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
      await queryClient.cancelQueries({ queryKey: ['messages', groupId] })
      if (!session?.user) return
      const userEmail = session.user.email || 'unknown@example.com'
      
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
    // Track message sent event with PostHog
    posthog.capture('message_sent', {
      room_id: groupId,
      message_length: messageText.length,
      has_emoji: /[\u{1F300}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(messageText),
    })
    
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
