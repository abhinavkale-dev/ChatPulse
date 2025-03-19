import cron from 'node-cron';
import prisma from './lib/prisma.server'; // Adjusted to match your Prisma path

// Set retention period for chat groups (in days)
const CHAT_GROUP_RETENTION_DAYS = 60; // 2 months

// Function to delete old chat groups that haven't been used in the specified retention period
async function cleanupOldChatGroups(): Promise<void> {
  try {
    // Calculate the cutoff date (current date minus retention period)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CHAT_GROUP_RETENTION_DAYS);
    
    // Find chat groups older than the retention period
    const oldGroups = await prisma.chatGroup.findMany({
      where: {
        updatedAt: {
          lt: cutoffDate
        }
      },
      select: {
        id: true
      }
    });
    
    const oldGroupIds = oldGroups.map((group: { id: string }) => group.id);
    
    if (oldGroupIds.length === 0) {
      console.log('No old chat groups to delete');
      return;
    }
    
    console.log(`Found ${oldGroupIds.length} chat groups older than ${CHAT_GROUP_RETENTION_DAYS} days`);
    
    // First delete all messages in these groups
    const deletedMessages = await prisma.chatMessage.deleteMany({
      where: {
        chatGroupId: {
          in: oldGroupIds
        }
      }
    });
    
    // Then delete the groups themselves
    const deletedGroups = await prisma.chatGroup.deleteMany({
      where: {
        id: {
          in: oldGroupIds
        }
      }
    });
    
    console.log(`Deleted ${deletedMessages.count} messages and ${deletedGroups.count} chat groups`);
  } catch (error) {
    console.error('Error cleaning up old chat groups:', error);
  }
}

// Function to setup the cleanup cron job
export function setupCleanupJob(): void {
  // Schedule the chat group cleanup job to run on the 1st day of every other month at 2:00 AM
  // The '0 2 1 */2 *' cron expression means: At 2:00 AM, on the 1st day of the month, every 2 months
  cron.schedule('0 2 1 */2 *', async () => {
    console.log('Running chat group cleanup job');
    await cleanupOldChatGroups();
  });
  
  console.log('Chat group cleanup job scheduled: runs every 2 months');
} 