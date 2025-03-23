"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const socket_1 = require("./socket/socket");
const redis_streams_adapter_1 = require("@socket.io/redis-streams-adapter");
const redis_1 = __importDefault(require("./redis/redis"));
const cleanup_1 = require("./cleanup");
const port = 8080;
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://chatpulse.chat"],
        methods: ["GET", "POST"],
        credentials: true
    },
    adapter: (0, redis_streams_adapter_1.createAdapter)(redis_1.default)
});
exports.io = io;
app.use(((0, cors_1.default)({
    origin: ["https://chatpulse.chat"],
    credentials: true
})));
(0, cleanup_1.setupCleanupJob)();
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
(0, socket_1.setupSocket)(io);
