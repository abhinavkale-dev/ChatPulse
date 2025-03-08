import { Queue, Worker, Job } from 'bullmq';
import redis from '../redis/redis'; // Your existing Redis connection from redis.ts
import prisma from "../../src//lib/prisma.server";

export interface ChatMessage {
  sender: string;
  message: string;
  room: string;
}

// Create a BullMQ queue for chat messages.
export const chatQueue = new Queue<ChatMessage>('chat_messages', { connection: redis });


// Create a BullMQ worker that processes chat messages and saves them to the database.
export const chatWorker = new Worker<ChatMessage>(
  'chat_messages',
  async (job: Job<ChatMessage>): Promise<ChatMessage> => {
    console.log(`Processing job ${job.id}: [${job.data.room}] ${job.data.sender}: ${job.data.message}`);
    
    // Save the chat message into the database using Prisma.
    const savedMessage = await prisma.ChatMessage.create({
      data: {
        sender: job.data.sender,
        message: job.data.message,
        room: job.data.room,
      },
    });
    
    console.log("Message saved to DB:", savedMessage);
    // Return the job data (could be used for further broadcasting).
    return job.data;
  },
  { connection: redis }
);

// Optional: Set up event listeners to log job results.
chatWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});
chatWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
  } else {
    console.error(`Job failed with error: ${err.message}`);
  }
});
