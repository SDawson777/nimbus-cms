# --- Build stage: API only ---
# Cache bust: 2026-02-03-v3-force-rebuild
FROM node:20-slim AS api-builder

WORKDIR /app

# Install required system packages for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy Prisma schema first (for generate step)
COPY prisma ./prisma

# Copy server manifest and install deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --legacy-peer-deps

# Generate Prisma client from current schema (AFTER npm install)
RUN npx prisma generate --schema=../prisma/schema.prisma

# Force cache invalidation with timestamp
RUN echo "Cache bust timestamp: $(date)" > /tmp/cache_bust_2026_02_03_v3

# Copy server source and build
COPY server ./
RUN npm run build

# --- Runtime stage ---
FROM node:20-slim AS runtime

WORKDIR /app/server

# Install required system packages for Prisma in runtime too
RUN apt-get update -y && apt-get install -y openssl

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=api-builder /app/prisma ../prisma
COPY --from=api-builder /app/server/dist ./dist
COPY --from=api-builder /app/server/package.json ./package.json
COPY --from=api-builder /app/server/node_modules ./node_modules
COPY --from=api-builder /app/server/init_and_start.sh ./init_and_start.sh

EXPOSE 8080

CMD ["sh", "./init_and_start.sh"]
