import { Server, Socket } from "socket.io";
import { chatQueue, chatWorker, ChatMessage } from "../bullmq/bullmq";

interface CustomSocket extends Socket {
  room?: string;
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
      console.log(`Socket ${socket.id} connected without a room (possibly admin UI)`);
    }

    console.log("Socket connected:", socket.id);

    // When a client sends a message, enqueue it into the BullMQ chat queue.
    socket.on("message", (data) => {
      console.log("Received socket message:", data);
      // Prepare the chat message using data from the client.
      const chatMessage: ChatMessage = {
        sender: data.name,  // Assuming the client sends a "name" field
        message: data.message || data.id, // Use data.message if available
        room: socket.room || 'general'
      };

      // Enqueue the chat message job.
      chatQueue.add('chat_message', chatMessage)
        .then((job) => {
          console.log(`Enqueued chat message with job id ${job.id}`);
        })
        .catch((err) => {
          console.error('Failed to enqueue chat message:', err);
        });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  // Listen for completed chat jobs from BullMQ.
  // When a job is completed, broadcast the processed chat message.
  chatWorker.on('completed', (job, result: ChatMessage) => {
    console.log(`Broadcasting message: [${result.room}] ${result.sender}: ${result.message}`);
    if (result.room) {
      io.to(result.room).emit("message", result);
    } else {
      io.emit("message", result);
    }
  });

  // Optional: Handle job failures.
  chatWorker.on('failed', (job, err) => {
    if (job) {
      console.error(`Job ${job.id} failed with error: ${err.message}`);
    } else {
      console.error(`Job failed with error: ${err.message}`);
    }
  });
}
