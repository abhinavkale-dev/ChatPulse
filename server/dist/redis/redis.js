"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = require("ioredis");
let redis;
if (process.env.NODE_ENV === "production") {
    if (process.env.REDIS_URL) {
        redis = new ioredis_1.Redis(process.env.REDIS_URL);
    }
    else {
        throw new Error("REDIS_URL is not defined in production environment");
    }
}
else {
    redis = new ioredis_1.Redis({
        host: "localhost",
        port: 6379
    });
}
exports.default = redis;
