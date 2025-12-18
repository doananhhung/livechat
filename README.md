# 💬 Live Chat Application

A modern, full-stack live chat application built with NestJS, React, and Socket.IO. Features real-time messaging, embeddable widget, team collaboration, and comprehensive project management.

---

## ✨ Features

### 🎯 Core Features

- **Real-time Messaging**: Instant bi-directional communication via Socket.IO
- **Embeddable Widget**: Lightweight chat widget for any website
- **Multi-Project Support**: Manage multiple chat projects from one dashboard

## ✨ Features

- **Team Collaboration**: Role-based access control (Owner, Manager, Member)
- **Conversation Management**: Organized inbox with status tracking
- **Invitation System**: Invite team members with smart user detection
- **Visitor Tracking**: Anonymous visitor identification and context tracking

### 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt encryption for user credentials
- **Rate Limiting**: Protection against spam and abuse
- **XSS Prevention**: Input sanitization and safe rendering
- **CORS Protection**: Configurable origin whitelist
- **SQL Injection Protection**: TypeORM parameterized queries

### ♿ Accessibility

- **WCAG Compliant**: Full keyboard navigation support
- **Screen Reader Friendly**: Comprehensive ARIA labels
- **Semantic HTML**: Proper heading structure and landmarks

### 🚀 Performance

- **Optimized Bundle**: ~45KB gzipped widget
- **Database Indexing**: Fast query performance
- **Redis Caching**: Session and data caching
- **Connection Pooling**: Efficient database connections

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

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/live_chat_app.git
   cd live_chat_app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   # Backend
   cd packages/backend
   cp .env.example .env
   # Edit .env with your configuration

   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**

   ```bash
   cd packages/backend
   npm run migration:run
   ```

5. **Start development servers**

   ```bash
   # Option 1: Start all services (from root)
   npm run dev

   # Option 2: Start individually
   # Terminal 1 - Backend
   cd packages/backend
   npm run dev:start

   # Terminal 2 - Frontend
   cd packages/frontend
   npm run dev
   ```

6. **Access the application**
   - **Dashboard**: http://localhost:5173
   - **API**: http://localhost:3000
   - **API Docs**: http://localhost:3000/api

---

## 📦 Package Details

### Backend (`packages/backend`)

NestJS-based REST API and WebSocket server.

**Key Features:**

- RESTful API endpoints
- WebSocket gateway for real-time messaging
- Authentication & authorization
- Database models and migrations
- Email service integration
- Redis session management
- AWS SQS queue processing

**Commands:**

```bash
npm run dev:start        # Start in watch mode
npm run build            # Build for production
npm run start:prod       # Run production build
npm run migration:generate src/database/migrations/Name
npm run migration:run    # Apply migrations
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
```

See [packages/backend/README.md](./packages/backend/README.md) for more details.

---

### Frontend (`packages/frontend`)

React-based dashboard and embeddable chat widget.

**Key Features:**

- Modern React dashboard UI
- Conversation management
- Team member management
- Project settings
- Analytics dashboard
- Embeddable chat widget (Preact-based)

**Commands:**

```bash
npm run dev              # Start dev server
npm run build            # Build dashboard
npm run build:widget     # Build embeddable widget
npm run preview          # Preview production build
npm run lint             # Lint code
```

See [packages/frontend/README.md](./packages/frontend/README.md) for more details.

---

### Shared (`packages/shared`)

Shared TypeScript types and utilities.

**Contents:**

- Type definitions
- Constants
- Helper functions
- Validation schemas

---

## 🔧 Configuration

### Backend Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=live_chat_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS (LocalStack for development)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566
```

### Frontend Environment Variables

```env
# API URL
VITE_API_URL=http://localhost:3000

# Widget Config
VITE_WIDGET_API_URL=http://localhost:3000
```

---

## 📚 Documentation

### User Guides

- **Widget Integration**: [packages/frontend/WIDGET_USAGE.md](./packages/frontend/WIDGET_USAGE.md)
- **UI Analysis**: [UI_ANALYSIS_AND_IMPROVEMENTS.md](./UI_ANALYSIS_AND_IMPROVEMENTS.md)
- **Settings Guide**: [UI_SETTINGS_ANALYSIS.md](./UI_SETTINGS_ANALYSIS.md)

### Technical Documentation

- **Backend API**: [packages/backend/README.md](./packages/backend/README.md)
- **Frontend**: [packages/frontend/README.md](./packages/frontend/README.md)
- **Architecture**: [docs/](./docs/)

### AI Assistant Notes

- **Root**: [GEMINI.md](./GEMINI.md)
- **Backend**: [packages/backend/GEMINI.md](./packages/backend/GEMINI.md)

---

## 🧪 Testing

### Backend Tests

```bash
cd packages/backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests

```bash
cd packages/frontend

# Run tests (when implemented)
npm run test
```

---

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Build

```bash
# Build backend
cd packages/backend
npm run build

# Build frontend
cd packages/frontend
npm run build
npm run build:widget

# Deploy build artifacts
# - Backend: dist/ folder
# - Frontend: dist/ folder (dashboard)
# - Widget: dist/widget/app.js
```

---

## 📊 Database Migrations

This project uses TypeORM migrations with `synchronize` disabled for production safety.

### Create a Migration

```bash
cd packages/backend

# Generate migration from entity changes
npm run migration:generate src/database/migrations/YourMigrationName

# Create empty migration
npm run typeorm migration:create src/database/migrations/YourMigrationName
```

### Run Migrations

```bash
# Apply pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

## 🔌 Widget Integration

Embed the chat widget on any website:

```html
<!-- Add before closing </body> tag -->
<script
  id="live-chat-widget"
  src="https://your-domain.com/widget/app.js"
  data-project-id="YOUR_PROJECT_ID"
  async
  defer
></script>
```

For advanced usage, see [WIDGET_USAGE.md](./packages/frontend/WIDGET_USAGE.md).

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier (auto-format on save recommended)

---

## 📝 Scripts Reference

### Root Level

```bash
npm run dev              # Start all services in parallel
npm run build            # Build all packages
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
```

### Backend Package

```bash
npm run dev:start        # Development mode
npm run build            # Production build
npm run start:prod       # Run production
npm run migration:run    # Run migrations
npm run test             # Unit tests
```

### Frontend Package

```bash
npm run dev              # Development server
npm run build            # Build dashboard
npm run build:widget     # Build widget
npm run preview          # Preview build
```

---

## 🐛 Troubleshooting

### Common Issues

**Database connection fails:**

- Check PostgreSQL is running: `sudo service postgresql status`
- Verify credentials in `.env`
- Ensure database exists: `createdb live_chat_db`

**Redis connection fails:**

- Check Redis is running: `redis-cli ping`
- Verify Redis host/port in `.env`

**Widget not loading:**

- Check CORS settings in backend
- Verify project ID is correct
- Check browser console for errors

**Socket.IO connection issues:**

- Ensure WebSocket is not blocked by firewall
- Check CORS configuration
- Verify backend is running

---

## 📄 License

This project is licensed under the **UNLICENSED** license - see the LICENSE file for details.

---

## 👥 Authors

- **Your Name** - Initial work

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [Socket.IO](https://socket.io/) - Real-time engine
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [TypeORM](https://typeorm.io/) - Database ORM

---

## 📞 Support

For support, email support@yourapp.com or open an issue in this repository.

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
