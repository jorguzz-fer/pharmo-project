# Backend Dockerfile
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files from root context
COPY packages/server/package*.json ./
COPY packages/server/tsconfig.json ./

# Install dependencies (might need modification if using root package-lock)
# Ideally we should copy root package logs if needed, but keeping it simple
RUN npm ci

# Copy source code
COPY packages/server/src ./src
COPY packages/server/prisma ./prisma

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
COPY packages/server/package*.json ./

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
