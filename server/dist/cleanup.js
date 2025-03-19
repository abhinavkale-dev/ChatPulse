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
// Set retention period for chat groups (in days)
const CHAT_GROUP_RETENTION_DAYS = 60; // 2 months
// Function to delete old chat groups that haven't been used in the specified retention period
function cleanupOldChatGroups() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Calculate the cutoff date (current date minus retention period)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - CHAT_GROUP_RETENTION_DAYS);
            // Find chat groups older than the retention period
            const oldGroups = yield prisma_server_1.default.chatGroup.findMany({
                where: {
                    updatedAt: {
                        lt: cutoffDate
                    }
                },
                select: {
                    id: true
                }
            });
            const oldGroupIds = oldGroups.map((group) => group.id);
            if (oldGroupIds.length === 0) {
                console.log('No old chat groups to delete');
                return;
            }
            console.log(`Found ${oldGroupIds.length} chat groups older than ${CHAT_GROUP_RETENTION_DAYS} days`);
            // First delete all messages in these groups
            const deletedMessages = yield prisma_server_1.default.chatMessage.deleteMany({
                where: {
                    chatGroupId: {
                        in: oldGroupIds
                    }
                }
            });
            // Then delete the groups themselves
            const deletedGroups = yield prisma_server_1.default.chatGroup.deleteMany({
                where: {
                    id: {
                        in: oldGroupIds
                    }
                }
            });
            console.log(`Deleted ${deletedMessages.count} messages and ${deletedGroups.count} chat groups`);
        }
        catch (error) {
            console.error('Error cleaning up old chat groups:', error);
        }
    });
}
// Function to setup the cleanup cron job
function setupCleanupJob() {
    // Schedule the chat group cleanup job to run on the 1st day of every other month at 2:00 AM
    // The '0 2 1 */2 *' cron expression means: At 2:00 AM, on the 1st day of the month, every 2 months
    node_cron_1.default.schedule('0 2 1 */2 *', () => __awaiter(this, void 0, void 0, function* () {
        console.log('Running chat group cleanup job');
        yield cleanupOldChatGroups();
    }));
    console.log('Chat group cleanup job scheduled: runs every 2 months');
}
