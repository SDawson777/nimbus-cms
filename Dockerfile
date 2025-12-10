# --- Build stage: API only ---
FROM node:20-slim AS api-builder

WORKDIR /app

# Install required system packages for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy root package files for workspace context
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy server directory with package.json and Prisma schema
COPY server ./server

# Install dependencies using pnpm
RUN npm install -g pnpm@10.20.0
RUN pnpm install --frozen-lockfile

# Build the server
WORKDIR /app/server
RUN pnpm run build

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
