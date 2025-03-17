/**
 * Chat related type definitions
 */

export interface ChatUser {
  email: string
  avatar?: string
}

export interface ChatMessage {
  id: string
  sender: string
  message: string
  room: string
  createdAt: string
  user: ChatUser
}

export interface ChatRoom {
  id: string
  title: string
}
