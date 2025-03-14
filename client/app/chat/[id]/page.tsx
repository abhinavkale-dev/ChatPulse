"use client"

import ChatBase from '@/components/chat/ChatBase'
import { useParams } from 'next/navigation'

export default function Chat() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex flex-col h-screen bg-background overflow-x-hidden">
      <header className="bg-background border-b border-border shadow-sm p-4">
        <h1 className="text-xl font-bold text-foreground">Be Respectful</h1>
        <h1 className="text-sm font-bold text-foreground">(Don&apos;t spam)</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatBase groupId={id} />
      </main>
    </div>
  )
}