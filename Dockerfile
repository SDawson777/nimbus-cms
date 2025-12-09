# --- Build stage: API only ---
FROM node:20-slim AS api-builder

WORKDIR /app

# Install system deps needed by Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy root Prisma folder
COPY prisma ./prisma

# Copy server manifests
COPY server/package.json server/package-lock.json ./server/

# Install server deps
RUN cd server && npm install --legacy-peer-deps

# Copy server source
COPY server ./server

# Build server
RUN cd server && npm run build

# Generate Prisma client (must run AFTER build + after schema exists)
RUN cd server && npx prisma generate --schema ../prisma/schema.prisma


# --- RUNTIME STAGE ----------------------------------------------------------
FROM node:20-slim AS runtime

WORKDIR /app

# Install OpenSSL again in runtime image
RUN apt-get update -y && apt-get install -y openssl

ENV NODE_ENV=production
ENV PORT=8080

# Copy prisma folder (optional but recommended)
COPY prisma ./prisma

# Copy server build artifacts
COPY --from=api-builder /app/server/dist ./server/dist
COPY --from=api-builder /app/server/package.json ./server/package.json
COPY --from=api-builder /app/server/node_modules ./server/node_modules

EXPOSE 8080

CMD ["node", "server/dist/index.js"]
