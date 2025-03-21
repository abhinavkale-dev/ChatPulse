import cron from 'node-cron';
import prisma from './lib/prisma.server';

const CHAT_GROUP_RETENTION_DAYS = 60;

async function cleanupOldChatGroups(): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CHAT_GROUP_RETENTION_DAYS);
    
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
    
    const deletedMessages = await prisma.chatMessage.deleteMany({
      where: {
        chatGroupId: {
          in: oldGroupIds
        }
      }
    });
    
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

export function setupCleanupJob(): void {
  cron.schedule('0 2 1 */2 *', async () => {
    console.log('Running chat group cleanup job');
    await cleanupOldChatGroups();
  });
  
  console.log('Chat group cleanup job scheduled: runs every 2 months');
} 