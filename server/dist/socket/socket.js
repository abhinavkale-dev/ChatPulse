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
const prisma_server_1 = __importDefault(require("../lib/prisma.server")); // Adjust the import path as needed
const redis_1 = __importDefault(require("../redis/redis")); // Using your existing redis.ts file
const CACHE_EXPIRY = 60 * 60 * 24; // 24 hours in seconds
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
            // Use Redis to check for cached messages first
            const cacheKey = `chat:${socket.room}:messages`;
            redis_1.default.get(cacheKey)
                .then((cachedMessages) => __awaiter(this, void 0, void 0, function* () {
                if (cachedMessages) {
                    console.log(`Using cached messages for room: ${socket.room}`);
                    const messages = JSON.parse(cachedMessages);
                    socket.emit("fetch_messages", messages);
                }
                else {
                    console.log(`Cache miss for room: ${socket.room}, fetching from DB`);
                    try {
                        const messagesFromDB = yield prisma_server_1.default.chatMessage.findMany({
                            where: { chatGroupId: socket.room },
                            orderBy: { createdAt: "asc" },
                        });
                        const formattedMessages = messagesFromDB.map((msg) => ({
                            id: msg.id,
                            sender: msg.sender,
                            message: msg.message,
                            room: msg.chatGroupId,
                            createdAt: msg.createdAt.toISOString(),
                            user: {
                                email: msg.userEmail,
                                avatar: msg.userAvatar || "",
                            },
                        }));
                        // Cache the messages in Redis
                        yield redis_1.default.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(formattedMessages));
                        socket.emit("fetch_messages", formattedMessages);
                    }
                    catch (error) {
                        console.error("Error fetching messages from DB:", error);
                    }
                }
            }))
                .catch(err => {
                console.error("Redis error:", err);
                // Fallback to database if Redis fails
                prisma_server_1.default.chatMessage.findMany({
                    where: { chatGroupId: socket.room },
                    orderBy: { createdAt: "asc" },
                })
                    .then((messagesFromDB) => {
                    const formattedMessages = messagesFromDB.map((msg) => ({
                        id: msg.id,
                        sender: msg.sender,
                        message: msg.message,
                        room: msg.chatGroupId,
                        createdAt: msg.createdAt.toISOString(),
                        user: {
                            email: msg.userEmail,
                            avatar: msg.userAvatar || "",
                        },
                    }));
                    socket.emit("fetch_messages", formattedMessages);
                })
                    .catch((err) => {
                    console.error("Error fetching messages from DB:", err);
                });
            });
        }
        else {
            console.log(`Socket ${socket.id} connected without a room`);
        }
        // Handle fetching messages on demand
        socket.on("fetch_messages", (data, callback) => {
            const cacheKey = `chat:${data.room}:messages`;
            redis_1.default.get(cacheKey)
                .then((cachedMessages) => __awaiter(this, void 0, void 0, function* () {
                if (cachedMessages) {
                    callback(JSON.parse(cachedMessages));
                }
                else {
                    try {
                        const messagesFromDB = yield prisma_server_1.default.chatMessage.findMany({
                            where: { chatGroupId: data.room },
                            orderBy: { createdAt: "asc" },
                        });
                        const formattedMessages = messagesFromDB.map((msg) => ({
                            id: msg.id,
                            sender: msg.sender,
                            message: msg.message,
                            room: msg.chatGroupId,
                            createdAt: msg.createdAt.toISOString(),
                            user: {
                                email: msg.userEmail,
                                avatar: msg.userAvatar || "",
                            },
                        }));
                        yield redis_1.default.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(formattedMessages));
                        callback(formattedMessages);
                    }
                    catch (err) {
                        console.error("Error fetching messages for room:", err);
                        callback([]);
                    }
                }
            }))
                .catch(err => {
                console.error("Redis error:", err);
                // Fallback to DB if Redis fails
                prisma_server_1.default.chatMessage.findMany({
                    where: { chatGroupId: data.room },
                    orderBy: { createdAt: "asc" },
                })
                    .then((messagesFromDB) => {
                    const formattedMessages = messagesFromDB.map((msg) => ({
                        id: msg.id,
                        sender: msg.sender,
                        message: msg.message,
                        room: msg.chatGroupId,
                        createdAt: msg.createdAt.toISOString(),
                        user: {
                            email: msg.userEmail,
                            avatar: msg.userAvatar || "",
                        },
                    }));
                    callback(formattedMessages);
                })
                    .catch((err) => {
                    console.error("Error fetching messages for room:", err);
                    callback([]);
                });
            });
        });
        // Handle sending a new message
        socket.on("send_message", (data) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Received message from ${data.user.email} for room ${data.room}`);
            // Ensure user info defaults
            const userInfo = {
                email: data.user.email || "unknown@example.com",
                avatar: data.user.avatar || "",
            };
            try {
                // Find the user by email to get their valid UUID
                const user = yield prisma_server_1.default.user.findUnique({
                    where: { email: userInfo.email }
                });
                if (!user) {
                    throw new Error(`User with email ${userInfo.email} not found`);
                }
                // Save message to the DB
                const savedMessage = yield prisma_server_1.default.chatMessage.create({
                    data: {
                        chatGroupId: data.room,
                        sender: data.sender,
                        message: data.message,
                        userId: user.id,
                        userEmail: userInfo.email,
                        userAvatar: userInfo.avatar,
                        // createdAt is automatically set by Prisma
                    },
                });
                const formattedMessage = {
                    id: savedMessage.id,
                    sender: savedMessage.sender,
                    message: savedMessage.message,
                    room: savedMessage.chatGroupId,
                    createdAt: savedMessage.createdAt.toISOString(),
                    user: {
                        email: savedMessage.userEmail,
                        avatar: savedMessage.userAvatar || "",
                    },
                };
                // Update Redis cache with the new message
                const cacheKey = `chat:${data.room}:messages`;
                redis_1.default.get(cacheKey)
                    .then((cachedMessages) => __awaiter(this, void 0, void 0, function* () {
                    let messages = [];
                    if (cachedMessages) {
                        messages = JSON.parse(cachedMessages);
                    }
                    messages.push(formattedMessage);
                    yield redis_1.default.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(messages));
                }))
                    .catch(err => {
                    console.error("Redis cache update error:", err);
                });
                // Broadcast the new message to all sockets in the room
                io.to(data.room).emit("new_message", formattedMessage);
                console.log(`Message broadcast to room: ${data.room}`);
            }
            catch (error) {
                console.error("Error saving message to DB:", error);
            }
        }));
        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
}
