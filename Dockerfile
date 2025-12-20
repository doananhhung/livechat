# ---- Base Stage: Sets up Node and installs system dependencies for Puppeteer ----
FROM node:22-slim AS base
WORKDIR /usr/src/app

# Install dependencies needed for Chrome to run headlessly
# ADDED libasound2 to this list to fix the shared library error
RUN apt-get update && apt-get install -y \
    procps \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files first to leverage Docker cache
COPY package*.json ./
COPY tsconfig.base.json ./

# ---- Build Shared Package Stage ----
FROM base AS shared-builder
COPY packages/shared ./packages/shared
RUN cd packages/shared && npm install && npm run build

# ---- Install Production Dependencies Stage ----
FROM base AS prod-deps
COPY packages/backend/package*.json ./packages/backend/
RUN cd packages/backend && npm install --production

# ---- Development Stage: For local development with hot-reloading ----
FROM base AS development
WORKDIR /usr/src/app/packages/backend

# Copy over the shared package source for development
COPY --from=shared-builder /usr/src/app/packages/shared ./packages/shared
COPY packages/backend ./

# Install all (dev and prod) dependencies
RUN npm install

# Define cache directory and give ownership of the home directory to the 'node' user
ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer
RUN chown -R node:node /home/node

# Download the Chrome browser for puppeteer
RUN npx puppeteer browsers install chrome

USER node
CMD ["npm", "run", "dev:start"]

# ---- Build Stage: Compiles the backend application ----
FROM development AS builder
# The 'npm install' from the development stage is already done
RUN npm run build

# ---- Production Stage: Creates a minimal final image ----
FROM base AS production
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 appgroup && adduser --system --uid 1001 --gid 1001 appuser

# Define cache directory and give ownership of the home directory to the 'appuser'
ENV PUPPETEER_CACHE_DIR=/home/appuser/.cache/puppeteer
RUN chown -R appuser:appgroup /home/appuser

# Copy only the necessary artifacts from previous stages
COPY --from=shared-builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=prod-deps /usr/src/app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /usr/src/app/packages/backend/dist ./packages/backend/dist
COPY packages/backend/package.json ./packages/backend/

# Download Chrome for puppeteer in production
RUN npx puppeteer browsers install chrome

USER appuser

WORKDIR /usr/src/app/packages/backend
CMD ["node", "dist/main.js"]