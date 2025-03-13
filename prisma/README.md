# Shared Prisma Schema

This directory contains the shared Prisma schema used by both the client and server applications.

## Why a Shared Schema?

We use a single schema file for both applications to follow the DRY (Don't Repeat Yourself) principle:

- Ensures database schema consistency across client and server
- Eliminates the need to update schema in multiple places
- Reduces the risk of schema drift between applications

## How to Use

### Client-Side Commands

Use the following npm scripts from the client directory:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### Server-Side Commands

Use the following npm scripts from the server directory:

```bash
# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio
npm run prisma:studio
```

## Schema Location

The schema is located at `/prisma/schema.prisma` in the project root. Both client and server reference this shared file. 