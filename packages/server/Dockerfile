# Backend Dockerfile
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files from 'packages' context
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY server/src ./src
COPY server/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files and prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
