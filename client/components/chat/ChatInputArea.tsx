"use client"

import { useState } from "react"
import { ChatInput } from "@/components/ui/chat-input"
import { Button } from "@/components/ui/button"
import { Send, Smile, Image } from "lucide-react"
import EmojiPicker, { Theme } from 'emoji-picker-react'
import GifPicker from 'gif-picker-react'

interface ChatInputAreaProps {
  messageText: string
  setMessageText: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
  maxMessageLength: number
}

export function ChatInputArea({ 
  messageText, 
  setMessageText, 
  handleSendMessage, 
  maxMessageLength 
}: ChatInputAreaProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    // Limit input to max characters
    if (value.length <= maxMessageLength) {
      setMessageText(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setMessageText((prevText: string) => prevText + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  return (
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
              maxLength={maxMessageLength}
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
            disabled={!messageText.trim() || messageText.length > maxMessageLength}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {messageText.length}/{maxMessageLength}
        </div>
      </div>
    </div>
  )
}
