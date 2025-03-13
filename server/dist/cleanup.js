"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCleanupJob = setupCleanupJob;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_server_1 = __importDefault(require("./lib/prisma.server")); // Adjusted to match your Prisma path
// Set your maximum DB size threshold to 4 GB (in bytes)
const MAX_DB_SIZE = 4 * 1024 * 1024 * 1024; // 4GB
// Function to get the current database size (PostgreSQL specific)
function getDatabaseSize() {
    return __awaiter(this, void 0, void 0, function* () {
        // This query retrieves the size (in bytes) of the current database
        const result = yield prisma_server_1.default.$queryRaw `
    SELECT pg_database_size(current_database()) as size;
  `;
        if (result && result[0] && result[0].size) {
            return typeof result[0].size === 'string' ?
                parseInt(result[0].size, 10) :
                result[0].size;
        }
        return 0;
    });
}
// Function to setup the cleanup cron job
function setupCleanupJob() {
    // Schedule the cron job to run every day at 3:00 AM
    node_cron_1.default.schedule('0 3 * * *', () => __awaiter(this, void 0, void 0, function* () {
        console.log('Running DB cleanup cron job at 3:00 AM');
        try {
            const dbSize = yield getDatabaseSize();
            console.log(`Current database size: ${dbSize} bytes`);
            if (dbSize >= MAX_DB_SIZE) {
                console.log('Database is full. Running cleanup.');
                // Delete all chat messages
                const result = yield prisma_server_1.default.chatMessage.deleteMany({});
                console.log(`Cleanup complete. Deleted ${result.count} chat messages.`);
            }
            else {
                console.log('Database is not full. Cleanup skipped.');
            }
        }
        catch (error) {
            console.error('Error during DB cleanup:', error);
        }
    }));
    console.log('Database cleanup job scheduled to run at 3:00 AM daily');
}
