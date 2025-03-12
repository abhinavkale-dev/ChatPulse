"use client"

import ChatBase from '@/components/chat/ChatBase'
import { useParams } from 'next/navigation'

export default function Chat() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white border-b shadow-sm p-4">
        <h1 className="text-xl font-bold text-gray-800">🚀 This is a temporary chat room 🚀</h1>
        <h1 className="text-sm font-bold text-gray-800">(Can't afford to buy a db storage for this)</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatBase groupId={id} />
      </main>
    </div>
  )
}