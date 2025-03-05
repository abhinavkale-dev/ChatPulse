import ChatBase from '@/components/chat/ChatBase'
import React from 'react'

async function Chat({params}: {params: {id:string}}) {
  const {id} = await params
    console.log("The group id is", id)
  return (
    <div>
        <h1>Hi from Chat</h1>
        <ChatBase groupId={id}/>
    </div>
  )
}

export default Chat