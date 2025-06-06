"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircleMore, MoreVertical, Share, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { useSession, signIn } from 'next-auth/react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from "sonner"

interface ChatGroup {
  id: string
  userId: string
  title: string
  createdAt: string
  totalParticipants: number
  updatedAt: string
}

function Home() {
  const { status } = useSession()
  const [rooms, setRooms] = useState<ChatGroup[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn();
      return;
    }
    

    const fetchRooms = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/rooms')
        if (!res.ok) {
          throw new Error("Failed to fetch")
        }
        const data = await res.json()
        setRooms(data.rooms || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching rooms:', err)
        setError('Failed to load rooms. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRooms()
  }, [status])

  const createRoom = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() 
    if (isCreating) return 
    
    setIsCreating(true)
    try {
      const roomName = newRoomName.trim() || `Room ${rooms.length + 1}`
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomName })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 429) {
          toast.error("Rate Limit Exceeded", {
            description: data.message || "You can only create 2 rooms per hour. Please try again later.",
            duration: 5000
          })
        } else {
          toast.error("Error", {
            description: data.error || "Failed to create room. Please try again."
          })
        }
        throw new Error(data.error || "Failed to create room")
      }
      
      setRooms(prevRooms => [data.room, ...prevRooms])
      setNewRoomName("")
      setOpen(false)
      
      toast.success("Room created!", {
        description: `Room "${roomName}" has been created successfully.`
      })
    } catch (err) {
      console.error('Error creating room:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete room");
        return;
      }

      setRooms(rooms.filter(room => room.id !== roomId));
      toast.success("Room deleted successfully");
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error("Failed to delete room");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}>Create Room</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
            <DialogDescription>Enter a name for your room</DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Enter room name"
            className="border p-2"
          />
          <Button onClick={createRoom} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="p-3 pt-14 md:pt-3 sm:p-6 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(24)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        ) : rooms && rooms.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500 mb-4">No rooms available. Create your first room!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <Card key={room.id} className="overflow-hidden hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div 
                    className="flex-1"
                    onClick={() => {
                      // Use window.location for Safari compatibility
                      window.location.href = `/chat/${room.id}`;
                    }}
                  >
                    <div>
                      <h1 className="text-xl font-medium">{room.title}</h1>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {room.totalParticipants} {room.totalParticipants === 1 ? 'participant' : 'participants'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircleMore className="text-primary" />
                    
                    {/* Share Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <Share className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            // Copy the room link to clipboard
                            const roomLink = `${window.location.origin}/chat/${room.id}`
                            navigator.clipboard.writeText(roomLink)
                            toast.success("Link copied to clipboard!")
                          }}
                          className="cursor-pointer"
                        >
                          <Share className="mr-2 h-4 w-4" />
                          <span>Copy Link</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            const roomLink = `${window.location.origin}/chat/${room.id}`
                            const twitterShareUrl = `https://twitter.com/intent/tweet?text=Join%20my%20ChatPulse%20room!&url=${encodeURIComponent(roomLink)}`
                            window.open(twitterShareUrl, '_blank')
                          }}
                          className="cursor-pointer"
                        >
                          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                          </svg>
                          <span>Share on Twitter</span>
                        </DropdownMenuItem>

                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* More Options Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDelete(room.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          <span>Delete room</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Home;
