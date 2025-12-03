# 📂 EduCore - File Index & Navigation Guide

## 🎯 Start Here

**New to the project?** Read in this order:
1. **PROJECT_SUMMARY.md** - Overview and what's included
2. **QUICKSTART.md** - Get running in 5 minutes
3. **README.md** - Detailed features and documentation
4. **ARCHITECTURE.md** - System design and architecture
5. **DEPLOYMENT.md** - Production deployment guide

## 📚 Documentation Files

| File | Purpose | Who Should Read |
|------|---------|----------------|
| **PROJECT_SUMMARY.md** | High-level overview, tech stack, features | Everyone |
| **QUICKSTART.md** | Step-by-step setup guide | Developers getting started |
| **README.md** | Complete project documentation | Everyone |
| **ARCHITECTURE.md** | System architecture, data models, API design | Senior developers, architects |
| **DEPLOYMENT.md** | Production deployment instructions | DevOps, deployment engineers |
| **FILE_INDEX.md** | This file - navigation guide | Everyone |

## 🔧 Configuration Files

### Root Level
- **docker-compose.yml** - Docker services configuration (PostgreSQL, Redis, MinIO)

### Server Configuration
- **server/.env.example** - Backend environment variables template
- **server/package.json** - Node.js dependencies and scripts
- **server/tsconfig.json** - TypeScript compiler configuration
- **server/prisma/schema.prisma** - Database schema and models

### Client Configuration
- **client/.env.example** - Frontend environment variables template
- **client/package.json** - React dependencies and scripts
- **client/vite.config.ts** - Vite build configuration
- **client/tailwind.config.js** - TailwindCSS configuration

## 💻 Source Code Structure

### Backend (server/src/)

#### Entry Point
- **index.ts** - Main application entry, Express setup, server initialization

#### Configuration
- **config/index.ts** - Environment variables and app configuration

#### Controllers (Request Handlers)
- **controllers/auth.controller.ts** - Authentication endpoints (login, register, etc.)
- **controllers/course.controller.ts** - Course CRUD operations

#### Middleware
- **middleware/auth.ts** - JWT authentication and authorization
- **middleware/errorHandler.ts** - Global error handling
- **middleware/rateLimiter.ts** - Rate limiting configuration
- **middleware/requestLogger.ts** - HTTP request logging

#### Routes
- **routes/auth.routes.ts** - Authentication route definitions

#### Services (Business Logic)
- **services/email.service.ts** - Email sending (welcome, reset password, etc.)

#### Socket.IO (Real-time)
- **socket/index.ts** - WebSocket server and event handlers

#### Utilities
- **utils/AppError.ts** - Custom error class
- **utils/logger.ts** - Winston logging configuration
- **utils/prisma.ts** - Prisma client singleton
- **utils/helpers.ts** - Helper functions (slug generation, pagination, etc.)

### Frontend (client/src/)

#### Entry Point
- **App.tsx** - Root component with routing setup

#### Components
- **components/courses/CourseCard.tsx** - Reusable course card component
- **components/auth/** - Authentication components
- **components/ui/** - shadcn/ui components

#### Pages
- **pages/HomePage.tsx** - Landing page
- **pages/auth/** - Login, Register pages
- **pages/courses/** - Course listing and details
- **pages/lessons/** - Lesson viewer
- **pages/dashboard/** - Dashboard pages

#### Services
- **services/api.ts** - Axios client and API service methods

#### State Management
- **stores/authStore.ts** - Zustand store for authentication state

## 🗄️ Database Schema

**Location**: `server/prisma/schema.prisma`

### Main Models (15 total)

| Model | Purpose |
|-------|---------|
| User | User accounts and authentication |
| Course | Course information and metadata |
| Module | Course modules (grouping lessons) |
| Lesson | Individual lessons with content |
| Enrollment | User course enrollments |
| Progress | Lesson completion tracking |
| Assignment | Assignments and tasks |
| Submission | Student assignment submissions |
| Review | Course reviews and ratings |
| Comment | Discussion comments |
| Notification | User notifications |
| Achievement | Gamification badges |
| UserAchievement | User achievement records |
| Activity | User activity logs |
| CoursePrerequisite | Course prerequisites |

## 🚀 Getting Started Checklist

- [ ] Read PROJECT_SUMMARY.md
- [ ] Read QUICKSTART.md
- [ ] Install prerequisites (Node.js, Docker)
- [ ] Run `docker-compose up -d`
- [ ] Setup server: `cd server && npm install`
- [ ] Setup client: `cd client && npm install`
- [ ] Copy environment files
- [ ] Run database migrations
- [ ] Start development servers
- [ ] Open http://localhost:5173

## 📖 Common Tasks

### Adding a New Feature

1. **Backend**:
   - Add route in `server/src/routes/`
   - Create controller in `server/src/controllers/`
   - Add business logic in `server/src/services/`
   - Update database schema if needed

2. **Frontend**:
   - Create page in `client/src/pages/`
   - Add components in `client/src/components/`
   - Add API service method in `client/src/services/api.ts`
   - Update routing in `client/src/App.tsx`

### Modifying the Database

1. Edit `server/prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update TypeScript types
4. Update controllers and services

### Adding Authentication to a Route

```typescript
// In routes file
import { authenticate, authorize } from '../middleware/auth';

router.get('/protected', authenticate, authorize('ADMIN'), controller.method);
```

### Creating a New Page

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Create API service methods if needed
4. Add navigation links

## 🔍 File Purpose Quick Reference

### When you need to...

**Add a new API endpoint**
→ `server/src/routes/` + `server/src/controllers/`

**Change database structure**
→ `server/prisma/schema.prisma`

**Modify authentication**
→ `server/src/middleware/auth.ts` + `server/src/controllers/auth.controller.ts`

**Add a new page**
→ `client/src/pages/` + `client/src/App.tsx`

**Update UI components**
→ `client/src/components/`

**Configure services (Postgres, Redis)**
→ `docker-compose.yml`

**Change API URL**
→ `client/.env` (VITE_API_URL)

**Modify email templates**
→ `server/src/services/email.service.ts`

**Add real-time features**
→ `server/src/socket/index.ts`

**Configure logging**
→ `server/src/utils/logger.ts`

**Add utility functions**
→ `server/src/utils/helpers.ts` or `client/src/utils/`

## 🎨 UI Components Location

All UI components use **shadcn/ui** and are located in:
- `client/src/components/ui/`

Common components:
- Button, Card, Badge, Dialog, Dropdown, etc.

## 🔐 Security Files

- **server/src/middleware/auth.ts** - Authentication middleware
- **server/src/middleware/rateLimiter.ts** - Rate limiting
- **server/src/utils/AppError.ts** - Error handling
- **server/.env** - Secrets and configuration (create from .env.example)

## 📊 Analytics & Monitoring

- **server/src/utils/logger.ts** - Winston logging
- **server/src/middleware/requestLogger.ts** - HTTP request logs
- API Documentation: http://localhost:3000/api-docs (when running)

## 🐳 Docker Files

- **docker-compose.yml** - Development services
- Future: Dockerfile.prod files for production builds

## 📦 Dependencies

### Backend Key Dependencies
- express - Web framework
- prisma - ORM
- socket.io - Real-time
- jsonwebtoken - JWT auth
- bcryptjs - Password hashing
- winston - Logging
- zod - Validation

### Frontend Key Dependencies
- react - UI library
- react-router-dom - Routing
- @tanstack/react-query - Server state
- zustand - Client state
- axios - HTTP client
- socket.io-client - WebSocket
- tailwindcss - Styling

## 🧪 Testing Files

Testing setup is ready but test files need to be added:
- Backend tests: `server/src/**/*.test.ts`
- Frontend tests: `client/src/**/*.test.tsx`

## 💡 Tips

1. **Always start with documentation** - Read relevant .md files first
2. **Follow the file structure** - Keep similar files together
3. **Use TypeScript types** - Leverage type safety
4. **Check .env.example** - For required environment variables
5. **Read inline comments** - Code is well-documented
6. **Use Prisma Studio** - `npx prisma studio` for DB GUI

## 🆘 Troubleshooting Guide

**Can't find something?**
- Backend code: `server/src/`
- Frontend code: `client/src/`
- Database schema: `server/prisma/schema.prisma`
- Environment vars: `.env.example` files
- Documentation: Root level `.md` files

**Need help with:**
- Setup: → QUICKSTART.md
- Architecture: → ARCHITECTURE.md
- Deployment: → DEPLOYMENT.md
- Features: → README.md
- Overview: → PROJECT_SUMMARY.md

---

**Happy Coding! 🚀**

For any questions, refer to the comprehensive documentation files or check the inline code comments.
