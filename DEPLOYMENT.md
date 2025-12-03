# EduCore Deployment Guide

This guide covers deploying the EduCore platform to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security Checklist](#security-checklist)

## Prerequisites

### Required Services
- **PostgreSQL 14+** - Primary database
- **Redis 7+** - Caching and sessions
- **Node.js 18+** - Runtime environment
- **Nginx** - Reverse proxy and static file serving
- **SSL Certificate** - For HTTPS (Let's Encrypt recommended)

### Recommended Services
- **MinIO/S3** - File storage
- **Sentry** - Error tracking
- **DataDog/New Relic** - Application monitoring
- **GitHub Actions/GitLab CI** - CI/CD pipeline

## Environment Setup

### 1. Server Environment Variables

Create `/server/.env` file:

```bash
# Production settings
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/educore_production

# Redis
REDIS_URL=redis://redis-host:6379

# JWT (Generate secure secrets!)
JWT_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Storage
STORAGE_PROVIDER=s3
S3_BUCKET=educore-production
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Client Environment Variables

Create `/client/.env.production`:

```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_APP_NAME=EduCore
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Database Setup

### 1. Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE educore_production;
CREATE USER educore_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE educore_production TO educore_user;
```

### 2. Run Migrations

```bash
cd server
npm install
npx prisma migrate deploy
npx prisma generate
```

### 3. Seed Initial Data (Optional)

```bash
npm run seed
```

## Application Deployment

### Option 1: Traditional VPS Deployment (Ubuntu)

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server
```

#### 2. Deploy Backend

```bash
# Clone repository
git clone https://github.com/yourusername/educore.git
cd educore/server

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name educore-api
pm2 save
pm2 startup
```

#### 3. Deploy Frontend

```bash
cd ../client

# Install dependencies
npm ci

# Build for production
npm run build

# Copy build to web server
sudo cp -r dist/* /var/www/educore/
```

#### 4. Configure Nginx

Create `/etc/nginx/sites-available/educore`:

```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/educore;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/educore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Option 2: Docker Deployment

#### 1. Create Production Dockerfile

`server/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
```

`client/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Docker Compose for Production

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  api:
    build:
      context: ./server
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  web:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec api npx prisma migrate deploy

# View logs
docker-compose logs -f
```

## Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Install PM2 Plus for monitoring
pm2 plus

# View logs
pm2 logs educore-api

# Monitor resources
pm2 monit
```

### 2. Application Logging

Configure Winston to send logs to external services:

```typescript
// server/src/utils/logger.ts (add)
import { Logtail } from '@logtail/node';

const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

transports.push(new LogtailTransport(logtail));
```

### 3. Error Tracking with Sentry

```bash
npm install @sentry/node
```

```typescript
// server/src/index.ts (add)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure JWT secrets
- [ ] Enable CORS properly
- [ ] Use helmet for security headers
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement proper authentication
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Use strong passwords
- [ ] Enable audit logging
- [ ] Implement CSRF protection
- [ ] Set secure cookie flags
- [ ] Regular security audits

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump -U educore_user educore_production | gzip > /backups/educore_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups -name "educore_*.sql.gz" -mtime +30 -delete
```

### Application Backups

- Use version control (Git) for code
- Backup uploaded files to S3 with versioning
- Document restore procedures

## Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Use connection pooling
   - Regular VACUUM and ANALYZE

2. **Caching**
   - Redis for session data
   - API response caching
   - CDN for static assets

3. **Application**
   - Enable gzip compression
   - Minify assets
   - Lazy loading for images
   - Database query optimization

## Troubleshooting

### Common Issues

**Issue: Cannot connect to database**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL
```

**Issue: PM2 process crashes**
```bash
# View error logs
pm2 logs educore-api --err

# Restart process
pm2 restart educore-api
```

**Issue: High memory usage**
```bash
# Check PM2 memory
pm2 monit

# Restart with memory limit
pm2 start dist/index.js --name educore-api --max-memory-restart 500M
```

## Support

For deployment issues, contact: devops@educore.com
