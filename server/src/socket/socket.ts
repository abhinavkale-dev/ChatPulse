import { Server, Socket } from "socket.io";
import prisma from "../lib/prisma.server";

interface CustomSocket extends Socket {
  room?: string;
}

interface ChatMessage {
  sender: string;
  message: string;
  room: string;
  createdAt?: Date;
}

export function setupSocket(io: Server) {

  io.use((socket: CustomSocket, next) => {
    const room = socket.handshake.auth.room;
    if (room) {
      socket.room = room;
    }
    next();
  });

  io.on("connection", (socket: CustomSocket) => {
    if (socket.room) {
      socket.join(socket.room);
      console.log(`Socket ${socket.id} joined room: ${socket.room}`);
    } else {
      console.log(`Socket ${socket.id} connected without a room`);
    }

    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
}
