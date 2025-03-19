"use client"

import { useState } from "react"
import { useChat } from "@/hooks/useChat"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { ChatInputArea } from "./ChatInputArea"

export default function ChatBase({ groupId }: { groupId: string }) {
  const {
    messages,
    isConnected,
    roomTitle,
    sendMessage,
    MAX_MESSAGE_LENGTH
  } = useChat(groupId)
  
  const [messageText, setMessageText] = useState("")

  const handleSendMessage = () => {
    if (!messageText.trim() || messageText.length > MAX_MESSAGE_LENGTH) return
    
    sendMessage(messageText)
    
    // Clear the input field
    setMessageText("")
  }

  return (
    <div className="flex flex-col h-full overflow-x-hidden overflow-y-hidden">
      <ChatHeader roomTitle={roomTitle} isConnected={isConnected} />
      <MessageList messages={messages} />
      <ChatInputArea
        messageText={messageText}
        setMessageText={setMessageText}
        handleSendMessage={handleSendMessage}
        maxMessageLength={MAX_MESSAGE_LENGTH}
      />
    </div>
  )
}