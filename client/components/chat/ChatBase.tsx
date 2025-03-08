"use client"

import { getSocket } from "@/app/lib/socket.config"
import  {useEffect, useMemo} from "react"
import {v4 as uuidV4} from "uuid"
import { Button } from "@/components/ui/button"

export default function ChatBase({groupId}: {groupId: string} ){
    let socket = useMemo(() => {
        const socket = getSocket()
        socket.auth = {
            room: groupId
        }

        return socket.connect()
    },[])

    useEffect(() => {
        socket.on("message", (data:any) => {
            console.log("The socket message is", data)
        })

    
        return () => {
            socket.close()
        }
    },[])

    const handleClick = () => {
        console.log("Clicked" + uuidV4())
        socket.emit("message", {name:"ABC", id:uuidV4()})
    }

    return (
        <Button onClick={handleClick}>Send</Button>
    )
}