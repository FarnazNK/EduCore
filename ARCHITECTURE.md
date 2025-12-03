# EduCore - System Architecture

## Overview

EduCore is a modern, scalable Learning Management System (LMS) built with a microservices-ready architecture using TypeScript, React, Node.js, and PostgreSQL.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite + TypeScript + TailwindCSS)        │   │
│  │  - React Router for navigation                       │   │
│  │  - React Query for server state                      │   │
│  │  - Zustand for client state                          │   │
│  │  - Socket.IO client for real-time updates           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Nginx Reverse Proxy                                 │   │
│  │  - SSL Termination                                   │   │
│  │  - Load Balancing                                    │   │
│  │  - Static file serving                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js (Node.js + TypeScript)                   │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   Routes    │  │Controllers  │  │  Services   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         Middleware Layer                    │    │   │
│  │  │  - Authentication (JWT)                     │    │   │
│  │  │  - Authorization (RBAC)                     │    │   │
│  │  │  - Rate Limiting                            │    │   │
│  │  │  - Error Handling                           │    │   │
│  │  │  - Request Logging                          │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         Socket.IO Server                    │    │   │
│  │  │  - Real-time notifications                  │    │   │
│  │  │  - Live chat/comments                       │    │   │
│  │  │  - Progress updates                         │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                ↓                          ↓
┌─────────────────────────┐  ┌──────────────────────────────┐
│    DATA LAYER           │  │    CACHE LAYER               │
│                         │  │                              │
│  PostgreSQL             │  │  Redis                       │
│  - Prisma ORM           │  │  - Session storage           │
│  - Migrations           │  │  - API response cache        │
│  - Connection pooling   │  │  - Rate limit counters       │
│  - Indexes              │  │  - Real-time data            │
└─────────────────────────┘  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   S3/MinIO  │  │   SendGrid  │  │   Stripe    │         │
│  │File Storage │  │Email Service│  │  Payments   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **React Query**: Server state management and caching
- **Zustand**: Lightweight client state management
- **React Router v6**: Client-side routing
- **Socket.IO Client**: Real-time bidirectional communication
- **Axios**: HTTP client with interceptors

### Backend
- **Node.js 18+**: JavaScript runtime
- **Express.js**: Web application framework
- **TypeScript**: Type-safe backend development
- **Prisma**: Modern ORM with type safety
- **PostgreSQL**: Primary relational database
- **Redis**: In-memory cache and session store
- **Socket.IO**: WebSocket server for real-time features
- **JWT**: Stateless authentication
- **Bcrypt**: Password hashing
- **Winston**: Logging library
- **Zod**: Runtime type validation
- **Nodemailer**: Email sending

### DevOps & Tools
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **PM2**: Process manager for Node.js
- **Nginx**: Reverse proxy and web server
- **GitHub Actions**: CI/CD pipeline
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework

## Core Modules

### 1. Authentication & Authorization

**Components:**
- JWT-based authentication
- Refresh token mechanism
- Role-based access control (RBAC)
- Password reset flow
- Email verification

**Security Features:**
- Bcrypt password hashing (12 rounds)
- HTTP-only cookies for refresh tokens
- Token expiration and rotation
- Rate limiting on auth endpoints
- CORS configuration

### 2. User Management

**User Roles:**
- **Student**: Can enroll in courses, track progress
- **Instructor**: Can create and manage courses
- **Admin**: Full system access

**Features:**
- User profiles with avatars
- Activity tracking
- Achievement system
- Notification preferences

### 3. Course Management

**Structure:**
```
Course
  ├── Modules
  │   └── Lessons
  │       ├── Video content
  │       ├── Text content
  │       ├── Resources (PDFs, files)
  │       └── Assignments
```

**Features:**
- CRUD operations for courses
- Draft/Published/Archived status
- Category and level classification
- Prerequisites system
- Rich text content support
- Multi-language support

### 4. Progress Tracking

**Tracked Metrics:**
- Lesson completion
- Video watch time
- Assignment submissions
- Quiz scores
- Overall course progress percentage

**Implementation:**
- Real-time progress updates via WebSocket
- Automatic enrollment progress calculation
- Resume functionality
- Progress analytics

### 5. Assessment System

**Types:**
- Assignments with file uploads
- Auto-graded quizzes
- Peer reviews
- Instructor grading

**Features:**
- Due dates and late submissions
- Grading rubrics
- Feedback mechanism
- Grade analytics

### 6. Real-time Features

**Powered by Socket.IO:**
- Live notifications
- Discussion comments
- Typing indicators
- Progress updates
- User presence

**Room Structure:**
- User rooms: `user:{userId}`
- Course rooms: `course:{courseId}`
- Lesson rooms: `lesson:{lessonId}`

### 7. Analytics & Reporting

**Student Analytics:**
- Enrolled courses
- Completion rates
- Time spent learning
- Achievement badges
- Learning streaks

**Instructor Analytics:**
- Course enrollment numbers
- Student engagement metrics
- Completion rates
- Revenue tracking (if paid)
- Student feedback

## Data Models

### Core Entities

1. **User**
   - Authentication credentials
   - Profile information
   - Role assignment
   - Activity logs

2. **Course**
   - Course metadata
   - Instructor relationship
   - Pricing information
   - Status and visibility

3. **Module**
   - Belongs to course
   - Ordering within course
   - Published state

4. **Lesson**
   - Content (video, text, rich media)
   - Belongs to module
   - Resources and attachments
   - Duration tracking

5. **Enrollment**
   - User-Course relationship
   - Status tracking
   - Progress percentage
   - Completion date

6. **Progress**
   - User-Lesson relationship
   - Completion status
   - Watch time tracking

7. **Assignment**
   - Belongs to lesson
   - Due dates
   - Max score
   - Submission requirements

8. **Submission**
   - User assignment submission
   - Score and feedback
   - Status tracking

### Supporting Entities

- **Review**: Course ratings and feedback
- **Comment**: Discussion and Q&A
- **Notification**: User notifications
- **Achievement**: Gamification badges
- **Activity**: User activity log

## API Design

### RESTful Endpoints

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

Courses:
GET    /api/courses
GET    /api/courses/:id
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
POST   /api/courses/:id/publish

Enrollments:
POST   /api/enrollments
GET    /api/enrollments/my-courses
GET    /api/enrollments/course/:courseId
DELETE /api/enrollments/:id

Progress:
GET    /api/progress/lesson/:lessonId
POST   /api/progress/lesson/:lessonId
GET    /api/progress/course/:courseId

Assignments:
GET    /api/assignments/:id
POST   /api/assignments/:id/submit
GET    /api/assignments/:id/my-submission
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... } // if applicable
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ] // validation errors
}
```

## Security Architecture

### Authentication Flow

1. User submits credentials
2. Server validates and generates JWT tokens
3. Access token (short-lived, 15min)
4. Refresh token (long-lived, 7 days)
5. Client stores tokens securely
6. Access token sent with each request
7. Automatic refresh on expiration

### Authorization Layers

1. **Route-level**: Protect entire routes
2. **Controller-level**: Check specific permissions
3. **Resource-level**: Verify ownership

### Data Protection

- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- HTTPS for data in transit
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (sanitization)
- CSRF tokens for state-changing operations

## Performance Optimization

### Database
- Indexed frequently queried fields
- Connection pooling
- Query optimization with Prisma
- Pagination for large datasets

### Caching Strategy
- Redis for session data
- API response caching
- Static asset caching (CDN)
- Browser caching headers

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization
- React Query caching

## Scalability Considerations

### Horizontal Scaling
- Stateless application servers
- Load balancer distribution
- Redis for shared sessions
- Database read replicas

### Vertical Scaling
- Resource optimization
- Connection pooling
- Efficient queries
- Memory management

### Future Enhancements
- Microservices architecture
- Message queue (Bull/RabbitMQ)
- CDN integration
- Kubernetes orchestration
- Multi-region deployment

## Monitoring & Observability

### Logging
- Winston for structured logging
- Log levels (error, warn, info, debug)
- Log aggregation (ELK stack ready)
- Request/response logging

### Metrics
- API response times
- Error rates
- User activity
- Resource utilization

### Error Tracking
- Sentry integration ready
- Error categorization
- Stack trace capture
- User context

## Backup & Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Backup retention policy
- Disaster recovery plan

### Application Backups
- Version control (Git)
- Configuration backups
- File storage backups (S3 versioning)

## Deployment Architecture

### Development
- Local Docker Compose
- Hot module reloading
- Development databases

### Staging
- Mirrors production
- Integration testing
- UAT environment

### Production
- Multiple app servers
- Load balancer
- Production database with replicas
- Redis cluster
- CDN for static assets
- Automated deployments

## Future Roadmap

### Phase 1 (Current)
- ✅ Core LMS features
- ✅ Authentication & Authorization
- ✅ Course management
- ✅ Progress tracking

### Phase 2
- [ ] Video streaming optimization
- [ ] Live classes integration
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

### Phase 3
- [ ] AI-powered recommendations
- [ ] Adaptive learning paths
- [ ] Advanced gamification
- [ ] Social learning features

### Phase 4
- [ ] Multi-tenancy support
- [ ] White-label solution
- [ ] Advanced reporting
- [ ] Enterprise features

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Maintained By**: EduCore Development Team
