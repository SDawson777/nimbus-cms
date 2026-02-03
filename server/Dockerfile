# Server Dockerfile for Nimbus Cannabis OS CMS API
# Purpose: compile the Express API and package for production use
# Note: Admin SPA is hosted separately on Vercel, not built here
# Cache bust: 2026-02-03-v1

#############################################################
## Stage 1: API builder (server/)
## - Installs deps, builds the Express server
#############################################################
FROM node:20 AS api-builder
WORKDIR /app

# Make Prisma schema available for server postinstall generate
COPY prisma ./prisma

# Install server dependencies and build API
COPY server/package.json ./server/
RUN cd server && npm install

# Copy server source and build (cache bust to force rebuild)
COPY server ./server
RUN cd server && npm run build

#############################################################
## Stage 2: Runtime (node:20-slim)
## - Copies compiled API artifacts only
## - Optimized for production deploys (Railway / GitHub Actions)
## - Note: Admin SPA hosted separately on Vercel
#############################################################
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4010

# Install system dependency for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl

# Ensure Prisma schema is available for postinstall generate
COPY --from=api-builder /app/prisma ./prisma

# Install production server dependencies only (will run prisma generate in postinstall)
COPY --from=api-builder /app/server/package.json ./server/package.json
RUN cd server && npm install --omit=dev

# Copy compiled server from api-builder
COPY --from=api-builder /app/server/dist ./server/dist

EXPOSE 4010

# Launch the Express API
CMD ["node", "server/dist/index.js"]
