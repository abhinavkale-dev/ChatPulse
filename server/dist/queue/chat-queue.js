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
exports.chatQueue = void 0;
exports.sendMessage = sendMessage;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../redis/redis"));
// Initialize a BullMQ queue for chat messages
const chatQueue = new bullmq_1.Queue('chat_messages', { connection: redis_1.default });
exports.chatQueue = chatQueue;
// Set up a worker that processes chat messages
const chatWorker = new bullmq_1.Worker('chat_messages', (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, message, room } = job.data;
    const chatRoom = room || 'general';
    // In a real chat app, you might persist the message to a DB or broadcast it via websockets.
    console.log(`[${chatRoom}] ${sender}: ${message}`);
    return 'Message processed';
}), { connection: redis_1.default });
// Listen to worker events
chatWorker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result: ${result}`);
});
chatWorker.on('failed', (job, err) => {
    console.error(`Job ${(job === null || job === void 0 ? void 0 : job.id) || 'unknown'} failed with error: ${err.message}`);
});
// Function to send (enqueue) a chat message
function sendMessage(sender_1, message_1) {
    return __awaiter(this, arguments, void 0, function* (sender, message, room = 'general') {
        const job = yield chatQueue.add('chat_message', { sender, message, room });
        console.log(`Enqueued message from ${sender} with job id ${job.id}`);
    });
}
