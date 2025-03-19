import { Server, Socket } from "socket.io";
import prisma from "../lib/prisma.server";
import redis from "../redis/redis";

interface ChatMessageRecord {
  id: string;
  sender: string;
  message: string;
  chatGroupId: string;
  createdAt: Date;
  userEmail: string;
  userAvatar?: string | null;
  userId: string;
}

interface CustomSocket extends Socket {
  room?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar?: string;
  message: string;
  room: string;
  createdAt: string;
  user: {
    email: string;
    avatar?: string;
  };
}

interface FetchMessagesData {
  room: string;
}

interface SendMessageData {
  sender: string;
  message: string;
  room: string;
  createdAt?: string;
  user: {
    email: string;
    avatar?: string;
  };
}

type FetchMessagesCallback = (messages: ChatMessage[]) => void;

// Redis cache expiry time (24 hours)
const CACHE_EXPIRY = 60 * 60 * 24;

function formatMessage(msg: ChatMessageRecord): ChatMessage {
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

async function getMessagesForRoom(room: string): Promise<ChatMessage[]> {
  const cacheKey = `chat:${room}:messages`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Using cached messages for room: ${room}`);
      return JSON.parse(cached);
    }
    console.log(`Cache miss for room: ${room}, fetching from DB`);
    const messagesFromDB = await prisma.chatMessage.findMany({
      where: { chatGroupId: room },
      orderBy: { createdAt: "asc" },
    });
    const formattedMessages = messagesFromDB.map(formatMessage);
    await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(formattedMessages));
    return formattedMessages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    const messagesFromDB = await prisma.chatMessage.findMany({
      where: { chatGroupId: room },
      orderBy: { createdAt: "asc" },
    });
    return messagesFromDB.map(formatMessage);
  }
}

export function setupSocket(io: Server): void {
  io.use((socket: CustomSocket, next) => {
    const room = socket.handshake.auth.room as string | undefined;
    if (room) {
      socket.room = room;
    }
    next();
  });

  io.on("connection", (socket: CustomSocket) => {
    if (socket.room) {
      socket.join(socket.room);
      console.log(`Socket ${socket.id} joined room: ${socket.room}`);
      getMessagesForRoom(socket.room)
        .then((messages) => socket.emit("fetch_messages", messages))
        .catch((err) => console.error("Error on connection:", err));
    } else {
      console.log(`Socket ${socket.id} connected without a room`);
    }

    socket.on("fetch_messages", async (data: FetchMessagesData, callback: FetchMessagesCallback) => {
      const messages = await getMessagesForRoom(data.room);
      callback(messages);
    });

    socket.on("send_message", async (data: SendMessageData) => {
      console.log(`Received message from ${data.user.email} for room ${data.room}`);

      const userInfo = {
        email: data.user.email || "unknown@example.com",
        avatar: data.user.avatar || null,
      };

      try {

        const user = await prisma.user.findUnique({ where: { email: userInfo.email } });
        if (!user) throw new Error(`User with email ${userInfo.email} not found`);

        const savedMessage = await prisma.chatMessage.create({
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
          const cachedMessages = await redis.get(cacheKey);
          let messages: ChatMessage[] = cachedMessages ? JSON.parse(cachedMessages) : [];
          messages.push(formattedMessage);
          await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(messages));
        } catch (err) {
          console.error("Redis cache update error:", err);
        }

        io.to(data.room).emit("new_message", formattedMessage);
        console.log(`Message broadcast to room: ${data.room}`);
      } catch (error) {
        console.error("Error saving message to DB:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
}