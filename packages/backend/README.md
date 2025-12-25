# 📦 Backend Service

This directory contains the NestJS-based backend for the Live Chat application. It handles the REST API, WebSocket connections for real-time messaging, user authentication, and all business logic.

---

## 🚀 Available Scripts

- `npm run build` - Compiles the main application for production.
- `npm run build:worker` - Compiles the background worker service.
- `npm run format` - Formats code using Prettier.
- `npm run start` - Starts the application in production mode.
- `npm run dev:start` - Starts the main application in watch mode for development.
- `npm run dev:worker` - Starts the worker service in watch mode for development.
- `npm run start:debug` - Starts the application in debug mode.
- `npm run lint` - Lints the codebase using ESLint.
- `npm run test` - Runs all unit tests.
- `npm run test:watch` - Runs unit tests in watch mode.
- `npm run test:cov` - Generates a test coverage report.
- `npm run test:e2e` - Runs end-to-end tests.

---

## 📊 Database Migrations

This project uses TypeORM to manage database schema changes safely.

- `npm run migration:generate src/database/migrations/YourMigrationName` - Generates a new migration file based on entity changes.
- `npm run migration:run` - Applies all pending migrations to the database.
- `npm run migration:revert` - Reverts the last applied migration.

---

## 🔧 Environment Variables

Create a `.env` file in this directory by copying the `.env.example` file. The following variables are required:

- **Database**: `PSQL_HOST`, `PSQL_PORT`, `PSQL_USER`, `PSQL_PASSWORD`, `PSQL_DATABASE`
- **Redis**: `REDIS_HOST`, `REDIS_PORT`
- **Authentication**: `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Two-Factor Auth**: `TWO_FACTOR_AUTH_JWT_SECRET`, `TWO_FACTOR_AUTH_JWT_EXPIRES_IN`, `TWO_FACTOR_APP_NAME`
- **Application**: `API_BASE_URL`, `NODE_ENV`, `ENCRYPTION_KEY`, `FRONTEND_URL`
- **Email**: `MAIL_APP_PASSWORD`, `MAIL_USER`

Refer to the `.env.example` file for more details and default development values.

---

## 📝 API Documentation

Once the application is running, OpenAPI (Swagger) documentation is automatically generated and available at `/api`.
