# Frontend Dockerfile
# Note: Easypanel uses repository root as build context
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from packages/client
COPY packages/client/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code from packages/client
COPY packages/client/ ./

# Copy tsconfig.base.json to parent directory (as expected by tsconfig.app.json)
COPY tsconfig.base.json ../

# Build production bundle
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx configuration inline
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json; \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
    } \
    location = /index.html { \
    add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
