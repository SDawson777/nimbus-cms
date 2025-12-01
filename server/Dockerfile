# Server Dockerfile for Nimbus Cannabis OS CMS API and Admin console
# Purpose: build the Admin SPA, compile the Express API, and package both for production use

#############################################################
## Stage 1: Admin builder (apps/admin)
## - Installs Admin SPA deps and runs the production build
## - Fails fast when the dist folder is missing/empty
#############################################################
FROM node:20 AS admin-builder
WORKDIR /app/apps/admin

# Install Admin SPA dependencies
COPY apps/admin/package.json apps/admin/package-lock.json ./
RUN npm ci

# Build Admin SPA
COPY apps/admin ./
RUN npm run build

# Ensure build output exists and is non-empty
RUN test -d dist && test "$(ls -A dist)" || \
	(echo "Admin build failed or produced no output" && exit 1)

#############################################################
## Stage 2: API builder (server/)
## - Installs root deps, builds the Express server, and copies admin dist
## - Copies admin output to /app/server/admin-dist and /app/dist with guards
#############################################################
FROM node:20 AS api-builder
WORKDIR /app

# Install server dependencies and build API
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# Copy server source and build
COPY server ./server
RUN cd server && npm run build

# Copy Admin SPA output into server + root dist locations
RUN mkdir -p server/admin-dist dist
COPY --from=admin-builder /app/apps/admin/dist ./server/admin-dist
COPY --from=admin-builder /app/apps/admin/dist ./dist

# Verify both admin-dist targets exist and are non-empty
RUN test -d server/admin-dist && test "$(ls -A server/admin-dist)" || \
	(echo "server/admin-dist missing after copy" && exit 1)
RUN test -d dist && test "$(ls -A dist)" || \
	(echo "dist missing after copy" && exit 1)

#############################################################
## Stage 3: Runtime (node:20-slim)
## - Copies compiled artifacts and admin dist
## - Optimized for production deploys (Railway / GitHub Actions)
#############################################################
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install production server dependencies only
COPY --from=api-builder /app/server/package.json ./server/package.json
COPY --from=api-builder /app/server/package-lock.json ./server/package-lock.json
RUN cd server && npm ci --omit=dev

# Copy compiled server + admin static assets from api-builder
COPY --from=api-builder /app/server/dist ./server/dist
COPY --from=api-builder /app/server/static ./server/static
COPY --from=api-builder /app/server/admin-dist ./server/admin-dist
COPY --from=api-builder /app/dist ./dist

EXPOSE 4010

# Launch the Express API
CMD ["node", "server/dist/index.js"]
