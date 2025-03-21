import { PrismaClient } from '@prisma/client';

declare global {
  var __db: PrismaClient | undefined;
}

// Use a singleton for the PrismaClient to avoid too many connections in development
let db: PrismaClient;

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  db = global.__db;
}

export { db };