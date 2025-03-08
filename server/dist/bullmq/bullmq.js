"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWorker = exports.chatQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../redis/redis")); // Your existing Redis connection from redis.ts
// Create a BullMQ queue for chat messages.
exports.chatQueue = new bullmq_1.Queue('chat_messages', { connection: redis_1.default });
// Initialize Prisma Client.
const prisma = new PrismaClient();
// Create a BullMQ worker that processes chat messages and saves them to the database.
exports.chatWorker = new bullmq_1.Worker('chat_messages', (job) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Processing job ${job.id}: [${job.data.room}] ${job.data.sender}: ${job.data.message}`);
    // Save the chat message into the database using Prisma.
    const savedMessage = yield prisma.chatMessage.create({
        data: {
            sender: job.data.sender,
            message: job.data.message,
            room: job.data.room,
        },
    });
    console.log("Message saved to DB:", savedMessage);
    // Return the job data (could be used for further broadcasting).
    return job.data;
}), { connection: redis_1.default });
// Optional: Set up event listeners to log job results.
exports.chatWorker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result:`, result);
});
exports.chatWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
});
