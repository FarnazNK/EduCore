# EduCore - Modern Ed-Tech Platform

A comprehensive, production-ready Learning Management System built with modern full-stack technologies.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **React Query** for server state management
- **Zustand** for client state management
- **React Router v6** for routing
- **shadcn/ui** for UI components

### Backend
- **Node.js** with Express
- **TypeScript**
- **PostgreSQL** with Prisma ORM
- **Redis** for caching
- **JWT** for authentication
- **Socket.io** for real-time features
- **Bull** for job queues

### DevOps
- **Docker** & Docker Compose
- **GitHub Actions** for CI/CD
- **ESLint** & Prettier
- **Jest** & React Testing Library

## Features

### Core Features
- 🎓 Course Management (CRUD operations)
- 👥 User Management (Students, Instructors, Admins)
- 📚 Content Delivery (Video, PDF, Interactive Quizzes)
- 📊 Progress Tracking & Analytics
- 💬 Real-time Discussion Forums
- 📝 Assignment Submission & Grading
- 🔔 Notification System
- 🎯 Gamification (Badges, Leaderboards)
- 📱 Responsive Design

### Advanced Features
- 🤖 AI-powered Content Recommendations
- 📹 Live Video Streaming
- 🔐 Role-based Access Control (RBAC)
- 📈 Advanced Analytics Dashboard
- 🌐 Multi-language Support
- ♿ Accessibility Compliant (WCAG 2.1)
- 🔍 Full-text Search
- 📧 Email Integration

## Project Structure

```
educore/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── stores/        # State management
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   ├── public/
│   └── package.json
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Configuration files
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/educore.git
cd educore
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# Server .env
cp server/.env.example server/.env

# Client .env
cp client/.env.example client/.env
```

4. Start services with Docker
```bash
docker-compose up -d
```

5. Run database migrations
```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

6. Start development servers
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

Visit http://localhost:5173 to see the application.

## API Documentation

API documentation is available at http://localhost:3000/api-docs when running the server.

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
