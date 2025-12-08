# --- Build stage: API only ---
FROM node:20-slim AS api-builder

WORKDIR /app/server

# Make Prisma schema available for postinstall generate
WORKDIR /app
COPY prisma ./prisma
WORKDIR /app/server

# Copy only server manifest and install deps (no lockfile to avoid mismatch)
COPY server/package.json ./
RUN npm install

# Copy server source and build
COPY server ./
RUN npm run build

# --- Runtime stage ---
FROM node:20-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app/server

# Copy built server and minimal runtime deps
COPY --from=api-builder /app/server/dist ./dist
COPY --from=api-builder /app/server/package.json ./package.json
COPY --from=api-builder /app/server/node_modules ./node_modules

EXPOSE 8080

# Use whatever start script you already use in `server/package.json`
CMD ["npm", "run", "start"]
