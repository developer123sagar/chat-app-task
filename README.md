# Real-Time Chat Application

A modern, full-stack real-time chat application built with Next.js 16, Socket.IO, and PostgreSQL. This application features secure authentication, persistent messaging, and a responsive user interface.

## 🚀 Features

- **Real-Time Communication**: Instant messaging powered by Socket.IO.
- **Secure Authentication**: JWT-based authentication with secure cookie handling.
- **User Status Tracking**: Real-time online/offline status updates for users.
- **Persistent Storage**: All messages and user data are stored securely in PostgreSQL using Prisma ORM.
- **Modern UI/UX**: Built with React 19, TailwindCSS 4, and Radix UI for accessible and beautiful components.
- **Responsive Design**: Fully optimized for desktop and mobile devices.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Real-Time Engine**: [Socket.IO](https://socket.io/) (Custom Node.js Server)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **State Management**: [React Query](https://tanstack.com/query/latest) & React Context

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running instance)

## ⚡ Getting Started

Follow these steps to set up the project locally.

### 1. Clone the repository
```bash
git clone <repository-url>
cd chat-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and populate it with the following variables:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/chat_db?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Client URL (for CORS configuration)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup
Run the Prisma migrations to create the database schema:
```bash
npx prisma generate
npm run prisma:migrate
```

### 5. Running the Application
To start the development server with the custom Socket.IO support, use:

```bash
npm run dev
```

> [!IMPORTANT]
> Do not just run `next dev`. You must run `npm run dev` which executes `node server.js` to ensure the WebSocket server is initialized correctly alongside Next.js.

The application will be available at [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure

```
.
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   ├── components/       # Reusable React components
│   ├── context/          # React Context (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and configurations
│   ├── services/         # API and Service layer logic
│   └── styles/           # Global styles
├── prisma/               # Prisma schema and migrations
├── server.js             # Custom Node.js server for Socket.IO
└── package.json          # Project dependencies and scripts
```

## 📜 Scripts

- `npm run dev`: Starts the development server with Socket.IO.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run prisma:studio`: Opens Prisma Studio to view database records.
