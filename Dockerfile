FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build Vite production dist
RUN npm run build

# Stage 2: Serve stage with Node.js Production Backend Server
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server.js ./

EXPOSE 80

ENV PORT=80
ENV NODE_ENV=production

CMD ["node", "server.js"]
