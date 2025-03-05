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
const admin_ui_1 = require("@socket.io/admin-ui");
const path_1 = __importDefault(require("path"));
const port = 8080;
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:8080", "http://192.168.1.255:3000"],
        methods: ["GET", "POST"],
        credentials: true
    },
    adapter: (0, redis_streams_adapter_1.createAdapter)(redis_1.default),
    transports: ['websocket', 'polling'] // Allow polling for admin UI
});
exports.io = io;
// Apply CORS middleware
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://localhost:8080", "http://192.168.1.255:3000"],
    credentials: true
}));
// Serve admin UI files locally
app.use('/admin', express_1.default.static(path_1.default.join(__dirname, '../node_modules/@socket.io/admin-ui/ui/dist')));
// Set up admin UI
(0, admin_ui_1.instrument)(io, {
    auth: false,
    mode: "development"
});
// Add a route to help with testing the server
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Socket.IO server is running',
        adminUi: 'http://localhost:8080/admin'
    });
});
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Local Admin UI: http://localhost:${port}/admin`);
});
(0, socket_1.setupSocket)(io);
