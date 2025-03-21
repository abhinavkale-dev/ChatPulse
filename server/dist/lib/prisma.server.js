"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
// Use a singleton for the PrismaClient to avoid too many connections in development
let db;
// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === 'production') {
    exports.db = db = new client_1.PrismaClient();
}
else {
    if (!global.__db) {
        global.__db = new client_1.PrismaClient();
    }
    exports.db = db = global.__db;
}
