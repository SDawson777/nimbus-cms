# syntax=docker/dockerfile:1.6

########################################
# STAGE 1 — ADMIN SPA BUILD
########################################
FROM node:20 AS admin-builder

ENV NODE_ENV=production

# Work in the admin app directory
WORKDIR /app/apps/admin

# Install admin dependencies
COPY apps/admin/package.json ./
RUN npm install

# Copy admin source and build
COPY apps/admin ./
RUN npm run build

# Ensure the admin build actually produced output
RUN test -d dist && test "$(ls -A dist)" || \
  (echo "Admin build failed or produced no output" && exit 1)


########################################
# STAGE 2 — API BUILD (BUNDLES ADMIN)
########################################
FROM node:20 AS api-builder
ARG FORCE_REBUILD=1

ENV NODE_ENV=production

WORKDIR /app

# Make Prisma schema available for server postinstall generate
COPY prisma ./prisma

# Install server dependencies (include dev deps needed to build)
COPY server/package.json ./server/
# Bust cache to force fresh install including dev deps
RUN echo "$FORCE_REBUILD" && cd server && npm install

# Copy server source and build
COPY server ./server
RUN cd server && npm run build

# Prepare output directories
RUN mkdir -p server/admin-dist dist

# Copy the built admin bundle into the server image
COPY --from=admin-builder /app/apps/admin/dist ./server/admin-dist
COPY --from=admin-builder /app/apps/admin/dist ./dist

# Sanity checks to fail-fast on broken builds
RUN test -d server/dist && test "$(ls -A server/dist)" || \
  (echo "Server build failed or produced no output" && exit 1)

RUN test -d server/admin-dist && test "$(ls -A server/admin-dist)" || \
  (echo "server/admin-dist missing after copy" && exit 1)

RUN test -d dist && test "$(ls -A dist)" || \
  (echo "dist missing after copy" && exit 1)


########################################
# STAGE 3 — RUNTIME IMAGE (PRODUCTION)
########################################
FROM node:20-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy server package metadata and install ONLY production deps
COPY --from=api-builder /app/server/package.json ./server/package.json

# Install prod dependencies only (no dev deps)
RUN cd server && npm install --omit=dev

# Copy built server + static assets from api-builder
COPY --from=api-builder /app/server/dist ./server/dist
COPY --from=api-builder /app/server/static ./server/static
COPY --from=api-builder /app/server/admin-dist ./server/admin-dist

# Copy top-level dist (if server serves this as well)
COPY --from=api-builder /app/dist ./dist

# Optional: run as non-root user (uncomment if/when your stack is ready)
# RUN useradd -m nodeuser
# USER nodeuser

EXPOSE 3000

# NOTE:
# If your compiled entrypoint is not "server/dist/index.js",
# change the CMD below to match your existing server start file.
CMD ["node", "server/dist/index.js"]
