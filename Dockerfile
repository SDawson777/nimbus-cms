# --- Build stage: API only ---
FROM node:20-slim AS api-builder

WORKDIR /app/server

# Install required system packages for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy server package.json first
COPY server/package.json ./

# Copy Prisma schema BEFORE npm install (needed for postinstall generate)
COPY server/prisma ./prisma

# Install deps (tolerate peer issues)
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

COPY --from=api-builder /app/server/dist ./dist
COPY --from=api-builder /app/server/package.json ./package.json
COPY --from=api-builder /app/server/node_modules ./node_modules
COPY --from=api-builder /app/server/prisma ./prisma

EXPOSE 8080

CMD ["npm", "run", "start"]
