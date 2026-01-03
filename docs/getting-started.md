# Getting Started

> **Goal:** Run the Live Chat system locally in under 15 minutes.

## Prerequisites

| Tool           | Version | Check Command            |
| -------------- | ------- | ------------------------ |
| Node.js        | ≥18.x   | `node --version`         |
| npm            | ≥9.x    | `npm --version`          |
| Docker         | ≥20.x   | `docker --version`       |
| Docker Compose | ≥2.x    | `docker compose version` |

---

## Option A: Docker Deployment (Quick Start)

> [!WARNING] > **Experimental:** Docker deployment has not been fully tested and may be unstable.
> Use [Option B](#option-b-manual-development-setup) for a more reliable development experience.

### 1. Clone and Configure

```bash
git clone <repository-url>
cd live_chat
cp .env.example .env
```

Edit `.env` and set required variables:

```bash
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
# Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET for OAuth
```

### 2. Start All Services

```bash
docker compose up -d --build
```

This starts:

- **PostgreSQL** (port 5442)
- **Redis** (internal)
- **Backend API** (port 3000)
- **Background Worker**
- **Frontend** (port 5173)

### 3. Run Database Migrations

```bash
PSQL_HOST=localhost PSQL_PORT=5442 PSQL_USER=postgres PSQL_PASSWORD=postgres PSQL_DATABASE=live_chat \
  npm run migration:run --prefix packages/backend
```

### 4. Verify

| Component   | URL                                 | Expected                  |
| ----------- | ----------------------------------- | ------------------------- |
| Frontend    | http://localhost:5173               | Login page loads          |
| Backend API | http://localhost:3000/api/v1        | Returns "Hello World!"    |
| Health      | http://localhost:3000/api/v1/health | Returns `{"status":"ok"}` |

### Docker Commands Cheatsheet

```bash
docker compose logs -f api      # View API logs
docker compose logs -f worker   # View worker logs
docker compose down             # Stop all services
docker compose up -d --build    # Rebuild and restart
docker system prune -a -f       # Clean unused images
```

---

## Option B: Manual Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd live_chat
```

### 2. Start Infrastructure

PostgreSQL and Redis via Docker:

```bash
cd packages/backend
docker compose up -d
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Key variables to set:

- `PSQL_*` - PostgreSQL connection settings (port 5435)
- `REDIS_*` - Redis connection settings (port 6380)
- `JWT_SECRET` - Secret for JWT signing
- `MAIL_*` - SMTP configuration for emails

### 4. Install Dependencies

```bash
npm install  # From root - installs all workspaces
```

### 5. Run Database Migrations

```bash
cd packages/backend
npm run migration:run
```

### 6. Start the Application

**Terminal 1 - Backend API:**

```bash
cd packages/backend
npm run start:dev
```

**Terminal 2 - Background Worker:**

```bash
cd packages/backend
npm run start:worker
```

**Terminal 3 - Frontend:**

```bash
cd packages/frontend
npm run dev
```

---

## Verify Setup

| Component   | URL                                 | What to Check       |
| ----------- | ----------------------------------- | ------------------- |
| Frontend    | http://localhost:5173               | Login page loads    |
| Backend API | http://localhost:3000/api/v1/health | Returns OK          |
| Widget      | Embed on test page                  | Chat bubble appears |

## Project Structure

```
live_chat/
├── packages/
│   ├── backend/           # NestJS API + Worker
│   │   ├── src/
│   │   │   ├── auth/      # Authentication
│   │   │   ├── inbox/     # Conversations & messages
│   │   │   ├── projects/  # Multi-tenancy
│   │   │   ├── gateway/   # WebSocket handlers
│   │   │   └── ...
│   │   └── ...
│   ├── frontend/          # React dashboard + Widget
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── services/  # API clients
│   │   │   ├── widget/    # Embeddable widget (Preact)
│   │   │   └── ...
│   │   └── ...
│   └── shared-*/          # Shared DTOs and types
├── docs/                  # High-level documentation
└── compose.yaml           # Full-stack Docker deployment
```

## Common Tasks

### Running Tests

```bash
# Backend tests
cd packages/backend
npm run test

# Frontend tests
cd packages/frontend
npm run test
```

### Creating a New User

1. Register via `/auth/register` endpoint
2. Check console for email verification link (in dev mode)
3. Verify email to activate account

### Embedding the Widget

```html
<script>
  (function () {
    var s = document.createElement("script");
    s.src = "http://localhost:5173/widget.js";
    s.setAttribute("data-project-id", "YOUR_PROJECT_ID");
    document.body.appendChild(s);
  })();
</script>
```

## Next Steps

1. **Understand the architecture:** Read [architecture.md](architecture.md)
2. **Explore features:** Browse investigations in `docs/deep_investigation/`
3. **Key investigations to start with:**
   - [user-authentication-flow.md](deep_investigation/user-authentication-flow.md) - Auth system
   - [projects-feature.md](deep_investigation/projects-feature.md) - Multi-tenancy
   - [inbox-operations.md](deep_investigation/inbox-operations.md) - Conversation management
   - [widget_connection_flow.md](deep_investigation/widget_connection_flow.md) - Widget integration

## Troubleshooting

| Issue                      | Solution                                      |
| -------------------------- | --------------------------------------------- |
| Database connection failed | Check `docker compose up -d` ran successfully |
| Redis connection failed    | Verify Redis container is running             |
| WebSocket not connecting   | Ensure backend is running on correct port     |
| Widget not loading         | Check `data-project-id` and domain whitelist  |
| Docker CORS errors         | Rebuild with `docker compose up -d --build`   |
