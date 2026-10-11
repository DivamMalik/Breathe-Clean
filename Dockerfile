FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY backend/package*.json ./backend/

RUN npm install

COPY . .

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=5001
ENV SESSION_SECRET=breathe-clean-production-secret-session-key-minimum-32-chars

EXPOSE 5001

CMD ["node", "src/server.js"]
