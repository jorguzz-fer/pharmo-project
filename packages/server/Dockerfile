# Single-stage build for reliability
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package.json (no lockfile in workspace setup)
COPY server/package.json ./

# Install all dependencies
RUN npm install

# Copy prisma schema and generate client
COPY server/prisma ./prisma/
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copy tsconfig, source code, and entrypoint
COPY server/tsconfig.json ./
COPY server/src ./src/
COPY server/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start with entrypoint (runs prisma db push + seed + server)
ENTRYPOINT ["./docker-entrypoint.sh"]
