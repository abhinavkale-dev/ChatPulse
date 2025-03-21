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
const prisma_server_1 = require("../lib/prisma.server");
const redis_1 = __importDefault(require("../redis/redis"));
// Redis cache expiry time (24 hours)
const CACHE_EXPIRY = 60 * 60 * 24;
function formatMessage(msg) {
    return {
        id: msg.id,
        sender: msg.sender,
        senderAvatar: msg.userAvatar || undefined,
        message: msg.message,
        room: msg.chatGroupId,
        createdAt: msg.createdAt.toISOString(),
        user: {
            email: msg.userEmail,
            avatar: msg.userAvatar || undefined,
        },
    };
}
function getMessagesForRoom(room) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheKey = `chat:${room}:messages`;
        try {
            const cached = yield redis_1.default.get(cacheKey);
            if (cached) {
                console.log(`Using cached messages for room: ${room}`);
                return JSON.parse(cached);
            }
            console.log(`Cache miss for room: ${room}, fetching from DB`);
            const messagesFromDB = yield prisma_server_1.db.chatMessage.findMany({
                where: { chatGroupId: room },
                orderBy: { createdAt: "asc" },
            });
            const formattedMessages = messagesFromDB.map(formatMessage);
            yield redis_1.default.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(formattedMessages));
            return formattedMessages;
        }
        catch (error) {
            console.error("Error fetching messages:", error);
            const messagesFromDB = yield prisma_server_1.db.chatMessage.findMany({
                where: { chatGroupId: room },
                orderBy: { createdAt: "asc" },
            });
            return messagesFromDB.map(formatMessage);
        }
    });
}
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
            getMessagesForRoom(socket.room)
                .then((messages) => socket.emit("fetch_messages", messages))
                .catch((err) => console.error("Error on connection:", err));
        }
        else {
            console.log(`Socket ${socket.id} connected without a room`);
        }
        socket.on("fetch_messages", (data, callback) => __awaiter(this, void 0, void 0, function* () {
            const messages = yield getMessagesForRoom(data.room);
            callback(messages);
        }));
        socket.on("send_message", (data) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Received message from ${data.user.email} for room ${data.room}`);
            const userInfo = {
                email: data.user.email || "unknown@example.com",
                avatar: data.user.avatar || null,
            };
            try {
                const user = yield prisma_server_1.db.user.findUnique({ where: { email: userInfo.email } });
                if (!user)
                    throw new Error(`User with email ${userInfo.email} not found`);
                const savedMessage = yield prisma_server_1.db.chatMessage.create({
                    data: {
                        chatGroupId: data.room,
                        sender: data.sender,
                        message: data.message,
                        userId: user.id,
                        userEmail: userInfo.email,
                        userAvatar: userInfo.avatar,
                    },
                });
                const formattedMessage = formatMessage(savedMessage);
                const cacheKey = `chat:${data.room}:messages`;
                try {
                    const cachedMessages = yield redis_1.default.get(cacheKey);
                    let messages = cachedMessages ? JSON.parse(cachedMessages) : [];
                    messages.push(formattedMessage);
                    yield redis_1.default.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(messages));
                }
                catch (err) {
                    console.error("Redis cache update error:", err);
                }
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
