import { Server, Socket } from "socket.io";

interface CustomSocket extends Socket {
    room?:string
}

export function setupSocket(io: Server) {

    io.use((socket:CustomSocket, next) => {
        const room = socket.handshake.auth.room 
        if(room) {
            socket.room = room
        }
        next()
    })


    io.on("connection", (socket: CustomSocket) => {

        if (socket.room) {
            socket.join(socket.room)
            console.log(`Socket ${socket.id} joined room: ${socket.room}`)
        } else {
            console.log(`Socket ${socket.id} connected without a room (possibly admin UI)`)
        }

        console.log("Socket connected: ", socket.id)

        socket.on("message", (data) => {
            console.log("Server message" , data)
            
            if(socket.room) {
                io.to(socket.room).emit("message", data)
            } else {
                socket.emit("message", data)
            }
        })

        socket.on("disconnect",() => {
            console.log("A user disconnected: ", socket.id)
        })
    })
}