# --- Build stage: API only ---
FROM node:20-slim AS api-builder

WORKDIR /app/server

# Install required system packages for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy server package file
COPY server/package.json ./

# Copy Prisma schema BEFORE install (needed for postinstall)
COPY server/prisma ./prisma

# Install dependencies with npm (without package-lock)
RUN npm install --legacy-peer-deps --no-package-lock

# Copy server source
COPY server/src ./src
COPY server/tsconfig.json ./tsconfig.json

# Build TypeScript
RUN npm run build

# --- Runtime stage ---
FROM node:20-slim AS runtime

WORKDIR /app/server

# Install required system packages for Prisma in runtime too
RUN apt-get update -y && apt-get install -y openssl

ENV NODE_ENV=production
ENV PORT=8080

# Copy built files
COPY --from=api-builder /app/server/dist ./dist
COPY --from=api-builder /app/server/package.json ./package.json

# Copy Prisma files
COPY --from=api-builder /app/server/prisma ./prisma

# Copy node_modules (includes Prisma CLI and generated client)
COPY --from=api-builder /app/server/node_modules ./node_modules

EXPOSE 8080

CMD ["npm", "run", "start"]
