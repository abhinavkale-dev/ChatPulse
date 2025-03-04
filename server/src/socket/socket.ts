import { Server } from "socket.io";

export function setupSocket(io: Server) {
    io.on("connection", (socket) => {
        console.log("Socket connected: ", socket.id)

        socket.on("message", (data) => {
            console.log("Server message" , data)
            io.emit("message", data)
        })

        socket.on("disconnect",() => {
            console.log("A user disconnected: ", socket.id)
        })
    })
}