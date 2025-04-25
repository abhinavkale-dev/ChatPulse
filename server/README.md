# ChatPulse Server

This is the backend server for ChatPulse, a real-time chat application.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express
- **Real-time Communication**: Socket.io
- **Database ORM**: Prisma
- **Caching/Pub-Sub**: Redis (via ioredis)
- **Task Scheduling**: node-cron

## Features

- Real-time messaging with WebSockets
- User presence detection
- Message persistence using Prisma
- Redis for scaling socket connections
- Scheduled tasks with node-cron

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- PostgreSQL database
- Redis server (for production deployments)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
4. Set up environment variables:
   - Create a `.env` file in the root directory
   - Define the following variables:
     ```
     DATABASE_URL="postgresql://user:password@localhost:5432/chatpulse"
     REDIS_URL="redis://localhost:6379"
     PORT=4000
     ```

### Development

Run the development server with hot-reload:

```bash
npm run dev
# or
yarn dev
```

The server will start on the port specified in your environment variables (default: 4000).

### Build for Production

```bash
npm run build
# or
yarn build
```

### Start Production Server

```bash
npm run prod
# or
yarn prod
```

## Project Structure

- `/src`: Source code
  - `/controllers`: Request handlers
  - `/models`: Data models
  - `/middleware`: Express middleware
  - `/socket`: Socket.io event handlers
  - `/utils`: Utility functions
- `/prisma`: Prisma schema and migrations
- `/dist`: Compiled JavaScript (generated)

## Available Scripts

- `dev`: Run development server with nodemon for hot reloading
- `build`: Compile TypeScript to JavaScript
- `start`: Start the compiled server
- `prod`: Start the server in production mode 