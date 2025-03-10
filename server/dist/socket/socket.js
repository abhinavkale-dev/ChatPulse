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
exports.setupSocket = setupSocket;
const prisma_server_1 = __importDefault(require("../lib/prisma.server"));
function setupSocket(io) {
    io.use((socket, next) => {
        const room = socket.handshake.auth.room;
        if (room) {
            socket.room = room;
        }
        next();
    });
    io.on("connection", (socket) => {
        if (socket.room) {
            socket.join(socket.room);
            console.log(`Socket ${socket.id} joined room: ${socket.room}`);
        }
        else {
            console.log(`Socket ${socket.id} connected without a room (possibly admin UI)`);
        }
        console.log("Socket connected:", socket.id);
        // Handle messages and save to database
        socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Received socket message:", data);
                if (!data.name || !data.message) {
                    console.error("Invalid message format. Required: name and message");
                    return;
                }
                const now = new Date();
                // Prepare the chat message
                const chatMessage = {
                    sender: data.name,
                    message: data.message,
                    room: socket.room || 'general',
                    createdAt: now
                };
                console.log(`Processing message: [${chatMessage.room}] ${chatMessage.sender}: ${chatMessage.message}`);
                // Broadcast the message directly to the room, including the timestamp
                if (chatMessage.room) {
                    io.to(chatMessage.room).emit("message", chatMessage);
                }
                else {
                    io.emit("message", chatMessage);
                }
                // Save the message to the database
                try {
                    const savedMessage = yield prisma_server_1.default.chatMessage.create({
                        data: {
                            sender: chatMessage.sender,
                            message: chatMessage.message,
                            room: chatMessage.room,
                            // createdAt is automatically set by Prisma
                        },
                    });
                    console.log(`Message saved to database with ID: ${savedMessage.id}`);
                }
                catch (dbError) {
                    console.error('Failed to save chat message to the primary table:', dbError);
                    // Fallback to Chats table if ChatMessage fails
                    try {
                        const savedChat = yield prisma_server_1.default.chats.create({
                            data: {
                                name: chatMessage.sender,
                                message: chatMessage.message,
                                groupId: chatMessage.room,
                                // createdAt is automatically set by Prisma
                            },
                        });
                        console.log(`Message saved to chats table with ID: ${savedChat.id}`);
                    }
                    catch (fallbackError) {
                        console.error('Failed to save to fallback table:', fallbackError);
                    }
                }
            }
            catch (error) {
                console.error('Error processing message:', error);
            }
        }));
        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
}
