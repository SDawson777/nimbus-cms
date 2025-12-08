# --- Build stage: API only ---
FROM node:20-slim AS api-builder

WORKDIR /app/server

# Copy only server manifests and install deps
COPY server/package.json server/package-lock.json ./
RUN npm ci

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
