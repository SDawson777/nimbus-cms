#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_DIR="$ROOT_DIR/apps/admin/test-ci-output"
mkdir -p "$LOG_DIR"

say() { printf "\n=== %s ===\n" "$*"; }

say "Stopping any existing server"
if [ -f "$ROOT_DIR/server.pid" ]; then
  kill "$(cat "$ROOT_DIR/server.pid")" 2>/dev/null || true
  rm -f "$ROOT_DIR/server.pid" || true
fi
pkill -f "node $ROOT_DIR/server/dist/index.js" 2>/dev/null || true

say "Using ephemeral pnpm via npx -y pnpm@9"
PNPM="npx -y pnpm@9"
eval "$PNPM --version"

say "Building admin (VITE_NIMBUS_API_URL=http://localhost:8080)"
eval "$PNPM -C server build"

say "Building admin (VITE_NIMBUS_API_URL=http://localhost:8080)"
VITE_NIMBUS_API_URL="http://localhost:8080" eval "$PNPM -C apps/admin build"

say "Copying admin dist -> server/static/admin (same-origin)"
mkdir -p server/static/admin
rm -rf server/static/admin/*
mkdir -p server/static
# Copy admin built files into server/static root so index.html's absolute
# asset paths (e.g. /assets/...) resolve correctly when served from /login
cp -a apps/admin/dist/. server/static/

say "Seeding deterministic E2E admins"
# These defaults match the CI workflow; you can override by exporting them before running this script.
export SERVER_JWT_SECRET="${SERVER_JWT_SECRET:-test-jwt-secret-xxxxxxxxxxxxxxxxxxxxxxxx}"
export JWT_SECRET="${JWT_SECRET:-$SERVER_JWT_SECRET}"
export E2E_ADMIN_EMAIL="${E2E_ADMIN_EMAIL:-e2e-admin@example.com}"
export E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-e2e-password}"
export E2E_ADMIN_SECONDARY_EMAIL="${E2E_ADMIN_SECONDARY_EMAIL:-e2e-editor@example.com}"
export E2E_ADMIN_SECONDARY_PASSWORD="${E2E_ADMIN_SECONDARY_PASSWORD:-e2e-editor-pass}"
export E2E_ADMIN_SECONDARY_ROLE="${E2E_ADMIN_SECONDARY_ROLE:-EDITOR}"
export E2E_VIEWER_EMAIL="${E2E_VIEWER_EMAIL:-e2e-viewer@example.com}"
export E2E_VIEWER_PASSWORD="${E2E_VIEWER_PASSWORD:-e2e-viewer-pass}"
export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
export ADMIN_STORE="${ADMIN_STORE:-file}"
export NODE_ENV="${NODE_ENV:-development}"
export CORS_ORIGIN_ADMIN="${CORS_ORIGIN_ADMIN:-http://localhost:8080}"

# Enable demo/fallback data for E2E tests (products, orders, analytics)
export USE_DEMO_DATA="${USE_DEMO_DATA:-true}"
export E2E_MODE="${E2E_MODE:-true}"

# Relax global rate limits for local E2E so SPA asset fan-out doesn't trigger 429s
export GLOBAL_RATE_LIMIT_MAX="${GLOBAL_RATE_LIMIT_MAX:-10000}"
export GLOBAL_RATE_LIMIT_WINDOW_MS="${GLOBAL_RATE_LIMIT_WINDOW_MS:-600000}"
export ADMIN_GLOBAL_RATE_LIMIT_MAX="${ADMIN_GLOBAL_RATE_LIMIT_MAX:-1000}"
export ADMIN_GLOBAL_RATE_LIMIT_WINDOW_MS="${ADMIN_GLOBAL_RATE_LIMIT_WINDOW_MS:-600000}"
export ADMIN_LOGIN_RATE_LIMIT_MAX="${ADMIN_LOGIN_RATE_LIMIT_MAX:-1000}"
export ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS="${ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS:-600000}"

# Sanity CMS credentials for E2E tests
export SANITY_PROJECT_ID="${SANITY_PROJECT_ID:-ygbu28p2}"
export SANITY_DATASET="${SANITY_DATASET:-nimbus_demo}"
export SANITY_API_TOKEN="${SANITY_API_TOKEN:-skPE7lw61OZSIuFeKJ5BG7TlFmXwnrqjMSFsMB5H8ZIEKMSK0ZADO26h2ecNYhVMl7nbM5T2nySB4jMekseFwYbcuwMPzMrW59v8r9uFA8qLUaCgf0xfVgbecbfi3yqk7u2Hd0GNvaRbqxwyQowo8x9rysVcsGpzXmio8yoWDUBMF1Q2EmN0}"

eval "$PNPM -C server run seed:e2e"

# The compiled server currently reads admins from dist/config; keep it in sync for local runs.
mkdir -p server/dist/config
if [ -f server/config/admins.json ]; then
  cp server/config/admins.json server/dist/config/admins.json
fi

say "Starting server (background)"
# Increase Node.js memory limit to prevent OOM during long test runs
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"
nohup node server/dist/index.js > "$ROOT_DIR/server.log" 2>&1 &
echo $! > "$ROOT_DIR/server.pid"

echo "server pid: $(cat "$ROOT_DIR/server.pid")"

say "Installing Playwright browsers (best-effort)"
# On macOS, --with-deps is a no-op; keep it for parity with CI.
eval "$PNPM -w dlx playwright install --with-deps" >/dev/null 2>&1 || eval "$PNPM -C apps/admin dlx playwright install --with-deps" >/dev/null 2>&1 || true

say "Waiting for server readiness"
READY=0
for i in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/healthz || true)"
  if [ "$code" = "200" ]; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" != "1" ]; then
  echo "API server did not become ready. Tail server.log:" >&2
  tail -n 200 "$ROOT_DIR/server.log" >&2 || true
  exit 3
fi

say "Running Playwright (E2E_BASE_URL=http://localhost:8080)"
export E2E_BASE_URL="http://localhost:8080"

# Forward extra args to Playwright, e.g. --workers=1
PLAYWRIGHT_ARGS="$*"
set +e
# Use pnpm exec to run playwright so args like --workers are treated as options
eval "$PNPM -C apps/admin exec playwright test --workers=1 $PLAYWRIGHT_ARGS"
E2E_EXIT=$?
set -e

say "Done (exit=$E2E_EXIT)"
echo "- server log: $ROOT_DIR/server.log"
echo "- login HTML: $LOG_DIR/ci-login.html"
echo "- playwright artifacts: $ROOT_DIR/apps/admin/test-results (and apps/admin/playwright-report)"

exit "$E2E_EXIT"
