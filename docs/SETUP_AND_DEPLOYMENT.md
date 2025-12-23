
# Setup & Deployment Guide

## 1. Prerequisites

*   **Node.js**: v18+
*   **Docker & Docker Compose**: For running infrastructure (Postgres, Redis).
*   **Chromium**: Required for the Screenshot Service (`puppeteer`).

## 2. Environment Configuration

Copy the example environment files and configure them:

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

### Critical Variables
*   `ENCRYPTION_KEY`: Must be exactly 32 characters.
*   `JWT_SECRET`: Strong random string.
*   `PSQL_HOST` / `REDIS_HOST`: Set to `localhost` for local dev, or service names for Docker networking.
*   `MAIL_*`: SMTP credentials are required for Invitations and Password Resets.

## 3. Infrastructure Setup

Start the database and Redis services:

```bash
cd packages/backend
docker-compose up -d
```

## 4. Database Migrations

The system uses **TypeORM** for migrations.

### Run Migrations
```bash
cd packages/backend
npm run migration:run
```

### Revert Migration
```bash
npm run migration:revert
```

### Generate Migration
After modifying an entity, generate a new migration file:
```bash
npm run migration:generate src/database/migrations/NameOfChange
```

## 5. Running the Application

The system consists of three parts that must run simultaneously:

### 5.1 Backend API
```bash
cd packages/backend
npm run start:dev
```

### 5.2 Backend Worker
Handles background jobs (Queue consumer).
```bash
cd packages/backend
npm run start:worker
```

### 5.3 Frontend
```bash
cd packages/frontend
npm run dev
```

## 6. System Dependencies

### Screenshot Service
The backend uses Puppeteer for generating website screenshots. On Linux/Docker environments, you may need to install dependencies:

```bash
# Install Chrome binary for Puppeteer
npx puppeteer browsers install chrome
```

### Redis
Redis is **mandatory**. The WebSocket Gateway will fail to start if it cannot connect to Redis, even in a single-node setup.
