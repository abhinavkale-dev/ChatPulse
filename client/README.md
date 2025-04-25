# ChatPulse Client

This is the frontend application for ChatPulse, a real-time chat application built with Next.js.

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Real-time Communication**: Socket.io client
- **Authentication**: NextAuth.js
- **Database ORM**: Prisma
- **Form Handling**: React Hook Form with Zod validation

## Features

- Real-time messaging
- User authentication
- Chat rooms/groups
- Responsive design

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- A running instance of the ChatPulse server

### Installation

1. Clone the repository
2. Navigate to the client directory:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
4. Set up your environment variables (create a `.env.local` file based on `.env.example` if available)

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
# or
yarn build
```

### Start Production Server

```bash
npm run start
# or
yarn start
```

## Project Structure

- `/app`: Application routes and pages
- `/components`: Reusable UI components
- `/hooks`: Custom React hooks
- `/providers`: Context providers
- `/types`: TypeScript type definitions
- `/prisma`: Prisma schema and client
- `/public`: Static assets
- `/lib`: Utility functions and shared logic

## Available Scripts

- `dev`: Run development server
- `build`: Build for production (includes Prisma generation)
- `start`: Start production server
- `lint`: Run ESLint


