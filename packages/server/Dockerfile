# Multi-stage build for production
# Stage 1: Builder
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy prisma schema and seeds
COPY server/prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY server/src ./src/

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Install OpenSSL for Prisma and bash for entrypoint
RUN apk add --no-cache openssl bash

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install production dependencies + tsx for running seeds
RUN npm ci --omit=dev && npm install tsx

# Copy built files, prisma, and entrypoint
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY server/docker-entrypoint.sh ./docker-entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
