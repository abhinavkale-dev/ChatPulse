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