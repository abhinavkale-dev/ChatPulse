"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
// In-memory message storage (temporary, no database)
const roomMessages = {};
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
            // Add socket to room
            socket.join(socket.room);
            console.log(`Socket ${socket.id} joined room: ${socket.room}`);
            // Initialize room if needed
            if (!roomMessages[socket.room]) {
                roomMessages[socket.room] = [];
            }
            // Send existing room messages to new user
            socket.emit("fetch_messages", roomMessages[socket.room] || []);
        }
        else {
            console.log(`Socket ${socket.id} connected without a room`);
        }
        // Handle fetching messages for a room
        socket.on("fetch_messages", (data, callback) => {
            console.log(`Fetching messages for room: ${data.room}`);
            callback(roomMessages[data.room] || []);
        });
        // Handle sending a new message
        socket.on("send_message", (data) => {
            console.log(`Received message from ${data.user.email} for room ${data.room}`);
            // Ensure user has avatar or generate one
            const userInfo = {
                name: data.user.name || 'Anonymous',
                email: data.user.email || 'unknown@example.com',
                avatar: data.user.avatar || ""
            };
            const message = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                sender: data.sender,
                message: data.message,
                room: data.room,
                user: userInfo
            };
            // Store in memory
            if (!roomMessages[data.room]) {
                roomMessages[data.room] = [];
            }
            roomMessages[data.room].push(message);
            // Broadcast to everyone in the room
            io.to(data.room).emit("new_message", message);
            console.log(`Message broadcast to room: ${data.room}`);
        });
        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
}
