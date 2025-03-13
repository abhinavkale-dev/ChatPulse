import express from "express"
import { Server } from "socket.io"
import {createServer} from "http"
import cors from "cors"
import { setupSocket } from "./socket/socket"
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./redis/redis"
import {instrument} from "@socket.io/admin-ui"
import { setupCleanupJob } from "./cleanup"

const port = 8080 
const app = express()
const server = createServer(app)

const io = new Server(server,{
    cors: {
        origin: ["http://localhost:3000", "https://admin.socket.io"],
        methods: ["GET", "POST"],
        credentials: true
    },
    adapter: createAdapter(redis)
})

app.use(cors())

instrument(io, {
    auth: false,
    mode: "development"
})

// Initialize the database cleanup cron job
setupCleanupJob();

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
setupSocket(io)
export {io}