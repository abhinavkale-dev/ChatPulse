"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  roomTitle: string
  isConnected: boolean
}

export function ChatHeader({ roomTitle, isConnected }: ChatHeaderProps) {
  const router = useRouter()

  return (
    <div className="border-b border-border p-4 flex items-center justify-between bg-background">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="font-semibold">{roomTitle || "Loading..."}</h1>
          <div className={cn(
            "h-2 w-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} title={isConnected ? "Connected" : "Disconnected"} />
        </div>
      </div>
    </div>
  )
}
