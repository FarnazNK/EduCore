# EduCore - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed

### Step 1: Clone or Download

If you received this as files, you're ready to go. Otherwise:
```bash
git clone <repository-url>
cd educore
```

### Step 2: Start Services with Docker

```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose up -d

# Wait a few seconds for services to be ready
```

### Step 3: Setup Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npm run seed

# Start development server
npm run dev
```

Server will be running at `http://localhost:3000`

### Step 4: Setup Client (New Terminal)

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Client will be running at `http://localhost:5173`

### Step 5: Access the Application

Open your browser and visit:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs

### Default Test Accounts (After Seeding)

**Admin:**
- Email: admin@educore.com
- Password: Admin123!

**Instructor:**
- Email: instructor@educore.com
- Password: Instructor123!

**Student:**
- Email: student@educore.com
- Password: Student123!

## 📁 Project Structure

```
educore/
├── server/                 # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   ├── config/        # Configuration
│   │   └── socket/        # WebSocket handlers
│   ├── prisma/           # Database schema
│   └── package.json
│
├── client/                # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── stores/       # State management (Zustand)
│   │   └── utils/        # Utilities
│   └── package.json
│
├── docker-compose.yml    # Docker services
├── README.md            # Main documentation
└── DEPLOYMENT.md        # Production deployment guide
```

## 🛠️ Development Commands

### Server Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
```

### Client Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
```

### Database Commands
```bash
npx prisma studio              # Open Prisma Studio (DB GUI)
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma generate           # Generate Prisma Client
npx prisma db seed            # Seed database
```

## 🔧 Environment Variables

### Server (.env)
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://educore:educore_dev_password@localhost:5432/educore_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:5173
```

### Client (.env)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## 📚 Key Features Implemented

### Backend
- ✅ JWT Authentication & Authorization
- ✅ Role-based Access Control (RBAC)
- ✅ RESTful API with comprehensive validation
- ✅ Real-time features with Socket.IO
- ✅ Email service integration
- ✅ File upload handling
- ✅ Database with Prisma ORM
- ✅ Redis caching
- ✅ Rate limiting
- ✅ Error handling
- ✅ Logging with Winston
- ✅ API documentation with Swagger

### Frontend
- ✅ Modern React with TypeScript
- ✅ State management with Zustand
- ✅ Server state with React Query
- ✅ Routing with React Router v6
- ✅ UI components with shadcn/ui
- ✅ Styling with TailwindCSS
- ✅ Form handling with React Hook Form
- ✅ Real-time updates with Socket.IO
- ✅ Responsive design

### Database Models
- ✅ Users (Students, Instructors, Admins)
- ✅ Courses with modules and lessons
- ✅ Enrollments and progress tracking
- ✅ Assignments and submissions
- ✅ Reviews and ratings
- ✅ Comments and discussions
- ✅ Notifications
- ✅ Achievements and gamification
- ✅ Activity tracking

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
npm run test:watch    # Watch mode
```

### Run Frontend Tests
```bash
cd client
npm test
npm run test:ui       # UI mode
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues
```bash
# Check Docker containers
docker-compose ps

# Restart services
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Prisma Issues
```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Force regenerate client
npx prisma generate --force
```

## 📖 Additional Resources

- [Full Documentation](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](http://localhost:3000/api-docs) (when running)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 💬 Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Email: support@educore.com

---

**Happy Coding! 🎉**
