# Server Dockerfile for JARS CMS API
## Multi-stage Dockerfile
## Builder: install deps and build TypeScript + admin assets
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copy full repo and build artifacts
COPY . .

# Build admin app (if present) and server
RUN npm run build:admin || true
RUN npm run build:api

## Runtime image: smaller footprint
FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built server and static assets from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/static ./server/static
COPY --from=builder /app/apps/admin/dist ./apps/admin/dist

EXPOSE 4010

CMD ["node", "server/dist/server.js"]
