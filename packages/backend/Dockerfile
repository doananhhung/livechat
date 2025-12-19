FROM node:22-slim
RUN apt-get update && apt-get install -y procps

WORKDIR /home/app
ENV PUPPETEER_CACHE_DIR=/home/app/.cache/puppeteer
RUN npx puppeteer browsers install chrome
# Copy root package files for workspace support
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy and build shared package first
COPY packages/shared ./packages/shared
RUN cd packages/shared && npm install && npm run build

# Copy backend package files
COPY packages/backend/package*.json ./packages/backend/
RUN cd packages/backend && npm install

# Copy backend source code
COPY packages/backend ./packages/backend

# Set working directory to backend
WORKDIR /usr/src/app/packages/backend

# Ensure files are owned by non-root user
RUN chown -R node:node /usr/src/app
USER node

CMD ["npm", "run", "dev:start"]