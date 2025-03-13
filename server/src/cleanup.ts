import cron from 'node-cron';
import prisma from './lib/prisma.server'; // Adjusted to match your Prisma path

// Set your maximum DB size threshold to 4 GB (in bytes)
const MAX_DB_SIZE = 4 * 1024 * 1024 * 1024; // 4GB

// Function to get the current database size (PostgreSQL specific)
async function getDatabaseSize(): Promise<number> {
  // This query retrieves the size (in bytes) of the current database
  const result = await prisma.$queryRaw<{ size: string | number }[]>`
    SELECT pg_database_size(current_database()) as size;
  `;
  if (result && result[0] && result[0].size) {
    return typeof result[0].size === 'string' ? 
      parseInt(result[0].size, 10) : 
      result[0].size as number;
  }
  return 0;
}

// Function to setup the cleanup cron job
export function setupCleanupJob(): void {
  // Schedule the cron job to run every day at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('Running DB cleanup cron job at 3:00 AM');
    try {
      const dbSize = await getDatabaseSize();
      console.log(`Current database size: ${dbSize} bytes`);
      if (dbSize >= MAX_DB_SIZE) {
        console.log('Database is full. Running cleanup.');
        // Delete all chat messages
        const result = await prisma.chatMessage.deleteMany({});
        console.log(`Cleanup complete. Deleted ${result.count} chat messages.`);
      } else {
        console.log('Database is not full. Cleanup skipped.');
      }
    } catch (error) {
      console.error('Error during DB cleanup:', error);
    }
  });
  
  console.log('Database cleanup job scheduled to run at 3:00 AM daily');
} 