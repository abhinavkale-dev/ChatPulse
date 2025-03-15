import { Server, Socket } from "socket.io";
import prisma from "../lib/prisma.server";
import redis from "../redis/redis";

// Define the database record type
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

const CACHE_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

const RATE_LIMIT = {
  MAX_MESSAGES: 10,
  TIME_WINDOW: 60,
  BLOCK_DURATION: 60,
};

const rateLimitedUsers = new Map<string, number>();

// Helper function to format a message from the DB record to ChatMessage interface
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

// Helper function to fetch messages for a room using Redis as a cache
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
    // Fallback to DB if Redis fails
    const messagesFromDB = await prisma.chatMessage.findMany({
      where: { chatGroupId: room },
      orderBy: { createdAt: "asc" },
    });
    return messagesFromDB.map(formatMessage);
  }
}

export function setupSocket(io: Server): void {
  // Middleware to set room on the socket
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

      // Immediately fetch and emit messages to the client on connection
      getMessagesForRoom(socket.room)
        .then((messages) => socket.emit("fetch_messages", messages))
        .catch((err) => console.error("Error on connection:", err));
    } else {
      console.log(`Socket ${socket.id} connected without a room`);
    }

    // Handle fetching messages on demand
    socket.on("fetch_messages", async (data: FetchMessagesData, callback: FetchMessagesCallback) => {
      const messages = await getMessagesForRoom(data.room);
      callback(messages);
    });

    // Handle sending a new message
    socket.on("send_message", async (data: SendMessageData) => {
      console.log(`Received message from ${data.user.email} for room ${data.room}`);

      const userInfo = {
        email: data.user.email || "unknown@example.com",
        avatar: data.user.avatar || null,
      };

      try {
        // Rate limiting logic
        const rateLimitKey = `ratelimit:${userInfo.email}:${data.room}`;
        const rateLimitedKey = `${userInfo.email}:${data.room}`;
        const currentTime = Math.floor(Date.now() / 1000);
        const limitExpireTime = rateLimitedUsers.get(rateLimitedKey);
        if (limitExpireTime && currentTime < limitExpireTime) {
          const timeRemaining = limitExpireTime - currentTime;
          socket.emit("error", {
            type: "RATE_LIMIT_EXCEEDED",
            message: `You're sending messages too quickly. Wait ${timeRemaining} seconds.`,
            retryAfter: timeRemaining,
          });
          return;
        }

        const userMessageCount = await redis.incr(rateLimitKey);
        if (userMessageCount === 1) {
          await redis.expire(rateLimitKey, RATE_LIMIT.TIME_WINDOW);
        }
        if (userMessageCount > RATE_LIMIT.MAX_MESSAGES) {
          console.log(`Rate limit exceeded for ${userInfo.email} in room ${data.room}`);
          const expireTime = currentTime + RATE_LIMIT.BLOCK_DURATION;
          rateLimitedUsers.set(rateLimitedKey, expireTime);
          setTimeout(() => {
            rateLimitedUsers.delete(rateLimitedKey);
          }, RATE_LIMIT.BLOCK_DURATION * 1000);
          socket.emit("error", {
            type: "RATE_LIMIT_EXCEEDED",
            message: `You're sending messages too quickly. Wait ${RATE_LIMIT.BLOCK_DURATION} seconds.`,
            retryAfter: RATE_LIMIT.BLOCK_DURATION,
          });
          socket.to(data.room).emit("moderation_event", {
            type: "USER_RATE_LIMITED",
            user: userInfo.email,
            message: `${userInfo.email} has been temporarily rate-limited.`,
          });
          return;
        }

        // Find user in DB
        const user = await prisma.user.findUnique({ where: { email: userInfo.email } });
        if (!user) throw new Error(`User with email ${userInfo.email} not found`);

        // Save message to DB
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

        // Update Redis cache with the new message
        const cacheKey = `chat:${data.room}:messages`;
        try {
          const cachedMessages = await redis.get(cacheKey);
          let messages: ChatMessage[] = cachedMessages ? JSON.parse(cachedMessages) : [];
          messages.push(formattedMessage);
          await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(messages));
        } catch (err) {
          console.error("Redis cache update error:", err);
        }

        // Broadcast the new message to the room
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