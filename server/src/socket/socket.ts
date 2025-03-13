import { Server, Socket } from "socket.io";
import prisma from "../lib/prisma.server"; // Adjust the import path as needed
import redis from "../redis/redis"; // Using your existing redis.ts file

interface CustomSocket extends Socket {
  room?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
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

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_MESSAGES: 10,     // Maximum messages allowed in the time window
  TIME_WINDOW: 60,      // Time window in seconds (1 minute)
  BLOCK_DURATION: 60    // How long to block a user after exceeding the limit (in seconds)
};

// Track rate-limited users
const rateLimitedUsers = new Map<string, number>(); // key: userEmail:roomId, value: timestamp when limit expires

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

      // Use Redis to check for cached messages first
      const cacheKey = `chat:${socket.room}:messages`;
      redis.get(cacheKey)
        .then(async (cachedMessages) => {
          if (cachedMessages) {
            console.log(`Using cached messages for room: ${socket.room}`);
            const messages: ChatMessage[] = JSON.parse(cachedMessages);
            socket.emit("fetch_messages", messages);
          } else {
            console.log(`Cache miss for room: ${socket.room}, fetching from DB`);
            try {
              const messagesFromDB = await prisma.chatMessage.findMany({
                where: { chatGroupId: socket.room },
                orderBy: { createdAt: "asc" },
              });
              const formattedMessages: ChatMessage[] = messagesFromDB.map((msg) => ({
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
              await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(formattedMessages));
              socket.emit("fetch_messages", formattedMessages);
            } catch (error) {
              console.error("Error fetching messages from DB:", error);
            }
          }
        })
        .catch(err => {
          console.error("Redis error:", err);
          // Fallback to database if Redis fails
          prisma.chatMessage.findMany({
            where: { chatGroupId: socket.room },
            orderBy: { createdAt: "asc" },
          })
          .then((messagesFromDB) => {
            const formattedMessages: ChatMessage[] = messagesFromDB.map((msg) => ({
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
    } else {
      console.log(`Socket ${socket.id} connected without a room`);
    }

    // Handle fetching messages on demand
    socket.on(
      "fetch_messages",
      (data: FetchMessagesData, callback: FetchMessagesCallback) => {
        const cacheKey = `chat:${data.room}:messages`;
        redis.get(cacheKey)
          .then(async (cachedMessages) => {
            if (cachedMessages) {
              callback(JSON.parse(cachedMessages));
            } else {
              try {
                const messagesFromDB = await prisma.chatMessage.findMany({
                  where: { chatGroupId: data.room },
                  orderBy: { createdAt: "asc" },
                });
                const formattedMessages: ChatMessage[] = messagesFromDB.map((msg) => ({
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
                await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(formattedMessages));
                callback(formattedMessages);
              } catch (err) {
                console.error("Error fetching messages for room:", err);
                callback([]);
              }
            }
          })
          .catch(err => {
            console.error("Redis error:", err);
            // Fallback to DB if Redis fails
            prisma.chatMessage.findMany({
              where: { chatGroupId: data.room },
              orderBy: { createdAt: "asc" },
            })
            .then((messagesFromDB) => {
              const formattedMessages: ChatMessage[] = messagesFromDB.map((msg) => ({
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
      }
    );

    // Handle sending a new message
    socket.on("send_message", async (data: SendMessageData) => {
      console.log(`Received message from ${data.user.email} for room ${data.room}`);

      // Ensure user info defaults
      const userInfo = {
        email: data.user.email || "unknown@example.com",
        avatar: data.user.avatar || "",
      };

      try {
        // Create a unique identifier for this user in this room
        const rateLimitKey = `ratelimit:${userInfo.email}:${data.room}`;
        const rateLimitedKey = `${userInfo.email}:${data.room}`;
        
        // Check if user is currently in a rate-limited state
        const currentTime = Math.floor(Date.now() / 1000);
        const limitExpireTime = rateLimitedUsers.get(rateLimitedKey);
        
        if (limitExpireTime && currentTime < limitExpireTime) {
          // User is still rate-limited
          const timeRemaining = limitExpireTime - currentTime;
          socket.emit("error", {
            type: "RATE_LIMIT_EXCEEDED",
            message: `You're sending messages too quickly. Please wait ${timeRemaining} seconds before trying again.`,
            retryAfter: timeRemaining
          });
          return; // Don't process the message
        }
        
        // Check rate limit before processing the message
        const userMessageCount = await redis.incr(rateLimitKey);
        
        // Set expiry on first message
        if (userMessageCount === 1) {
          await redis.expire(rateLimitKey, RATE_LIMIT.TIME_WINDOW);
        }
        
        // Check if user has exceeded rate limit
        if (userMessageCount > RATE_LIMIT.MAX_MESSAGES) {
          console.log(`Rate limit exceeded for user ${userInfo.email} in room ${data.room}`);
          
          // Add user to rate-limited map with expiry time
          const expireTime = currentTime + RATE_LIMIT.BLOCK_DURATION;
          rateLimitedUsers.set(rateLimitedKey, expireTime);
          
          // Schedule removal from rate-limited map
          setTimeout(() => {
            rateLimitedUsers.delete(rateLimitedKey);
          }, RATE_LIMIT.BLOCK_DURATION * 1000);
          
          // Emit rate limit error to the spamming user only
          socket.emit("error", {
            type: "RATE_LIMIT_EXCEEDED",
            message: `You're sending messages too quickly. Please wait ${RATE_LIMIT.BLOCK_DURATION} seconds before trying again.`,
            retryAfter: RATE_LIMIT.BLOCK_DURATION
          });
          
          // Notify room moderators or administrators (optional)
          socket.to(data.room).emit("moderation_event", {
            type: "USER_RATE_LIMITED",
            user: userInfo.email,
            message: `${userInfo.email} has been temporarily rate-limited for sending too many messages.`
          });
          
          return; // Don't process the message
        }

        // Find the user by email to get their valid UUID
        const user = await prisma.user.findUnique({
          where: { email: userInfo.email }
        });
        if (!user) {
          throw new Error(`User with email ${userInfo.email} not found`);
        }

        // Save message to the DB
        const savedMessage = await prisma.chatMessage.create({
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

        const formattedMessage: ChatMessage = {
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
        redis.get(cacheKey)
          .then(async (cachedMessages) => {
            let messages: ChatMessage[] = [];
            if (cachedMessages) {
              messages = JSON.parse(cachedMessages);
            }
            messages.push(formattedMessage);
            await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(messages));
          })
          .catch(err => {
            console.error("Redis cache update error:", err);
          });

        // Broadcast the new message to all sockets in the room
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