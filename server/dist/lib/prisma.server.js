"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = global.prismaClient || new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    global.prismaClient = prisma;
}
exports.default = prisma;
