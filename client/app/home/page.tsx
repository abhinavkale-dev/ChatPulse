"use client"

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'
import { nanoid } from 'nanoid'
import { signOut } from 'next-auth/react'

function Home() {

    const router = useRouter()

    const handleChat = () => {
        const randomId = nanoid()

        router.push(`/chat/${randomId}`)

    } 

  return (
    <div>
        <Button onClick={handleChat}>Let's Chat</Button>
        <Button variant="destructive" onClick={() => {signOut({callbackUrl: "/"})}}>Logout</Button>
    </div>
  )
}

export default Home