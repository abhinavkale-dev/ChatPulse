"use client"

import ChatBase from '@/components/chat/ChatBase'
import { useParams } from 'next/navigation'

export default function Chat() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex flex-col h-screen bg-background overflow-x-hidden">
      <main className="flex-1 overflow-hidden">
        <ChatBase groupId={id} />
      </main>
    </div>
  )
}