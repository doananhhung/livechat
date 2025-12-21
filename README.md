# 💬 Live Chat Application

A modern, full-stack live chat application built with NestJS, React, and Socket.IO. Features real-time messaging, embeddable widget, team collaboration, and comprehensive project management.

---

## The Problem
Businesses relying on Zalo/Messenger for website chat force customers into a disjointed experience, redirecting them away and requiring logins. Their support team works "blind" with zero context, like browsing history, making professional support inefficient, impersonal, and difficult to manage as a team.

## Our Solution
Our app provides a seamless, on-site live chat widget that keeps visitors engaged, with no login required. Our dashboard empowers support agents with rich visitor context, including browsing history, enabling a professional, team-based approach to provide instant support and convert visitors into customers.

---

## ✨ Features

- **Real-time Messaging**: Instant bi-directional communication via Socket.IO.
- **Embeddable Widget**: Lightweight (~45KB gzipped) chat widget for any website.
- **Multi-Project & Team Support**: Manage multiple projects with role-based access control (Owner, Manager, Member).
- **Conversation Management**: Organized inbox with status tracking and an invitation system.
- **Visitor Tracking**: Anonymous visitor identification and context tracking.
- **Security**: JWT Authentication, password hashing, rate limiting, XSS/CORS/SQL Injection protection.
- **Accessibility**: WCAG compliant with full keyboard navigation and screen reader support.
- **Performance**: Optimized with database indexing, Redis caching, and connection pooling.

---

## 🏗️ Architecture

### Monorepo Structure

```
live_chat_app/
├── packages/
│   ├── backend/          # NestJS API server
│   ├── frontend/         # React dashboard + embeddable widget
│   └── shared/           # Shared types and utilities
└── docs/                 # Project documentation
```

### Technology Stack

**Backend:**

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Queue**: AWS SQS
- **ORM**: TypeORM
- **Auth**: Passport.js + JWT

**Frontend:**

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **API Client**: Axios + React Query
- **Router**: React Router v7
- **Widget**: Preact (lightweight)

**DevOps:**

- **Containerization**: Docker + Docker Compose
- **Local Cloud**: LocalStack (AWS services)
- **Database Migrations**: TypeORM CLI

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 14.x
- **Redis** >= 6.x
- **Docker** (optional, for containerized development)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/live_chat_app.git
    cd live_chat_app
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Setup environment variables**

    Create `.env` files in `packages/backend` and `packages/frontend` by copying the `.env.example` files and filling in your configuration.

4.  **Run database migrations**

    ```bash
    cd packages/backend
    npm run migration:run
    ```

5.  **Start development servers**

    ```bash
    # Start all services (from root)
    npm run dev
    ```

6.  **Access the application**
    - **Dashboard**: http://localhost:5173
    - **API**: http://localhost:3000
    - **API Docs**: http://localhost:3000/api

---

## 📦 Package Details

### Backend (`packages/backend`)

NestJS-based REST API and WebSocket server handling all business logic, real-time communication, and data persistence. See [packages/backend/README.md](./packages/backend/README.md) for more details.

### Frontend (`packages/frontend`)

React-based dashboard for team collaboration and an embeddable Preact chat widget for customer-facing websites. See [packages/frontend/README.md](./packages/frontend/README.md) for more details.

### Shared (`packages/shared`)

Shared TypeScript types, constants, and utility functions to ensure consistency between the frontend and backend.

---

## 📚 Documentation

- **Widget Integration**: [packages/frontend/WIDGET_USAGE.md](./packages/frontend/WIDGET_USAGE.md)
- **Backend API**: [packages/backend/README.md](./packages/backend/README.md)
- **Frontend**: [packages/frontend/README.md](./packages/frontend/README.md)
- **Architecture**: [docs/](./docs/)
- **AI Assistant Notes**: [GEMINI.md](./GEMINI.md)

---

## 🧪 Testing

Run tests for each package from their respective directories.

```bash
# Backend tests (unit, e2e, coverage)
cd packages/backend
npm run test
npm run test:e2e

# Frontend tests
cd packages/frontend
npm run test
```

---

## 🐳 Docker Deployment

A Docker Compose setup is included for a containerized development environment.

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down
```
For production, build the packages and deploy the `dist/` artifacts.

---

## 🤝 Contributing

1.  **Fork the repository**
2.  **Create a feature branch**: `git checkout -b feature/amazing-feature`
3.  **Commit changes**: `git commit -m 'Add amazing feature'`
4.  **Push to branch**: `git push origin feature/amazing-feature`
5.  **Open a Pull Request**

---

## 🗺️ Roadmap

- [ ] Mobile applications (iOS/Android)
- [ ] File sharing in chat
- [ ] Rich text formatting
- [ ] Emoji picker
- [ ] Read receipts
- [ ] Typing indicators for multiple users
- [ ] Voice/video calls
- [ ] Chatbot integration
- [ ] Analytics dashboard
- [ ] Export chat transcripts

---

**Made with ❤️ using NestJS, React, and Socket.IO**
