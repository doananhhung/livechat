FROM node:22-slim
RUN apt-get update && apt-get install -y procps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .
# Ensure files are owned by non-root user to prevent permission issues on host
RUN chown -R node:node /usr/src/app
USER node

CMD ["npm", "run", "dev:start"]