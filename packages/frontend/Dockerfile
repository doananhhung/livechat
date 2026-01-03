# =============================================================================
# Frontend Dockerfile - Multi-stage build for React/Vite application
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-dtos/package.json ./packages/shared-dtos/
COPY packages/frontend/package.json ./packages/frontend/

# Install all dependencies (npm workspaces - some deps are hoisted, some are not)
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
# IMPORTANT: Both root and frontend node_modules are needed (not fully hoisted)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend/node_modules ./packages/frontend/node_modules

# Copy source code
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-dtos ./packages/shared-dtos
COPY packages/frontend ./packages/frontend

# Build shared packages first
RUN npm run build --workspace=@live-chat/shared-types --if-present
RUN npm run build --workspace=@live-chat/shared-dtos --if-present

# Build frontend
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_API_BASE_URL

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Run vite build directly (skip tsc type-check in Docker)
RUN cd packages/frontend && npx vite build
RUN cd packages/frontend && npx vite build --config vite.config.widget.ts || true

# -----------------------------------------------------------------------------
# Stage 3: Production Server (Nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Create non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
