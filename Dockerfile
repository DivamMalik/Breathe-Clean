FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
COPY backend/package*.json ./backend/

RUN npm install

COPY . .

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "src/server.js"]
