
# Live Chat System

A scalable, real-time customer support chat platform built with **NestJS**, **React**, **PostgreSQL**, and **Redis**.

## 📚 Documentation Suite

This repository contains detailed documentation covering all architectural aspects of the system:

*   **[Architecture Overview](docs/ARCHITECTURE.md)**: High-level topology, Split-Process Monolith, and Redis roles.
*   **[Authentication & Security](docs/AUTHENTICATION.md)**: Hybrid Token-Session model, 2FA State Machine, and OAuth patterns.
*   **[Real-time & Widget](docs/REALTIME_AND_WIDGET.md)**: WebSocket Gateway, Room strategy, and the Embeddable Widget architecture.
*   **[Database & Events](docs/DATABASE_AND_EVENTS.md)**: Event-Driven Core, Transactional Outbox pattern, and Data Denormalization.
*   **[Setup & Deployment](docs/SETUP_AND_DEPLOYMENT.md)**: Environment config, Docker setup, and Migration commands.

## 🚀 Quick Start

### 1. Infrastructure
Start PostgreSQL and Redis:
```bash
cd packages/backend
docker-compose up -d
```

### 2. Backend
Install dependencies and run migrations:
```bash
cd packages/backend
npm install
npm run migration:run
```

Start the API and Worker:
```bash
# Terminal 1
npm run start:dev

# Terminal 2
npm run start:worker
```

### 3. Frontend
Install dependencies and start the dev server:
```bash
cd packages/frontend
npm install
npm run dev
```

## 🌟 Key Features

*   **Multi-Tenancy**: Project-based isolation with RBAC (Manager/Agent).
*   **Real-time Messaging**: Socket.IO gateway with Redis adapter for horizontal scaling.
*   **Event-Driven**: BullMQ for asynchronous message processing.
*   **Reliability**: Transactional Outbox pattern ensures data consistency.
*   **Security**: 2FA, Stateful JWTs, and Encrypted Secrets.
*   **Embeddable Widget**: Lightweight Preact widget with Shadow DOM isolation.

## 🛠 Tech Stack

*   **Backend**: NestJS, TypeORM, BullMQ, Passport, Socket.IO
*   **Frontend**: React, Vite, Tailwind CSS, Zustand, TanStack Query
*   **Widget**: Preact, Shadow DOM
*   **Infrastructure**: PostgreSQL, Redis
