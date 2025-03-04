"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log("Socket connected: ", socket.id);
        socket.on("message", (data) => {
            console.log("Server message", data);
            io.emit("message", data);
        });
        socket.on("disconnect", () => {
            console.log("A user disconnected: ", socket.id);
        });
    });
}
