declare module '@socket.io/redis-streams-adapter' {
  import { Adapter } from 'socket.io-adapter';
  import { Redis } from 'ioredis';
  
  // Return type that matches what Socket.IO's adapter() method expects
  export function createAdapter(redisClient: Redis, options?: {
    streamName?: string;
    consumerGroup?: string;
    consumer?: string;
  }): (srv: any) => Adapter;
}
