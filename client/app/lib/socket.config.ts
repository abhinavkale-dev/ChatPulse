import {io, Socket} from "socket.io-client"
import Env from "./env"

let socket:Socket
export const getSocket = () => {
    if(!socket) {
        socket = io(Env.BACKEND_URL, {
            autoConnect: false,
            auth: {
                // You can add room info here when connecting to a specific room
                // For admin UI connections, no room is needed
            }
        })

    }

    return socket
}