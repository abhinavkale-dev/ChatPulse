import express from "express"
import { Server as SocketIOServer } from "socket.io"
import { createServer } from "http"
import cors from "cors"
import { setupSocket } from "./socket/socket"
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./redis/redis"
import { setupCleanupJob } from "./cleanup"

const port = 8080 
const app = express()
const server = createServer(app)

// Create the Socket.IO server with the adapter directly in the options
const io = new SocketIOServer(server, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Set up Redis adapter
io.adapter(createAdapter(redis));

app.use(cors())

setupCleanupJob();

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
setupSocket(io)
export {io}