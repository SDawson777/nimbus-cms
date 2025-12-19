# --- Build stage: API only ---
FROM node:20-slim AS api-builder

WORKDIR /app/server

# Install required system packages for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Ensure Prisma schema is available for postinstall generate
WORKDIR /app
COPY prisma ./prisma
WORKDIR /app/server

# Copy manifest only and install deps (tolerate peer issues)
COPY server/package.json ./
RUN npm install --legacy-peer-deps

# Copy source
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
