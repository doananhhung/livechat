# =============================================================================
# Backend Dockerfile - Multi-stage build for NestJS application
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Copy workspace files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-dtos/package.json ./packages/shared-dtos/
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies (npm workspaces - some deps are hoisted, some are not)
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
# IMPORTANT: Both root and backend node_modules are needed (not fully hoisted)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules

# Copy source code
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-dtos ./packages/shared-dtos
COPY packages/backend ./packages/backend

# Build shared packages first
RUN npm run build --workspace=@live-chat/shared-types --if-present
RUN npm run build --workspace=@live-chat/shared-dtos --if-present

# Build backend
RUN npm run build:prod --workspace=@live-chat/backend

# -----------------------------------------------------------------------------
# Stage 3: Production Runner (API)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS api

WORKDIR /app

# Install runtime dependencies for Puppeteer (Chrome)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application and dependencies
COPY --from=builder --chown=nestjs:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-dtos/dist ./packages/shared-dtos/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-dtos/package.json ./packages/shared-dtos/
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Set environment
ENV NODE_ENV=production \
    NODE_PATH=/app/node_modules:/app/packages/backend/node_modules

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]

# -----------------------------------------------------------------------------
# Stage 4: Production Runner (Worker)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS worker

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application and dependencies
COPY --from=builder --chown=nestjs:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-dtos/dist ./packages/shared-dtos/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-dtos/package.json ./packages/shared-dtos/
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Set environment
ENV NODE_ENV=production \
    NODE_PATH=/app/node_modules:/app/packages/backend/node_modules

USER nestjs

CMD ["node", "dist/worker.js"]
