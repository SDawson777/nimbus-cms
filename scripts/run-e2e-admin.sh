#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${E2E_PORT:-8080}"
BASE_URL="${E2E_BASE_URL:-http://localhost:${PORT}}"
SERVER_LOG="${E2E_SERVER_LOG:-/tmp/nimbus-e2e-server.log}"

cleanup() {
  local pids
  pids=$(lsof -ti ":${PORT}" 2>/dev/null || true)
  if [[ -n "${pids}" ]]; then
    kill -9 ${pids} >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

cleanup

npx -y pnpm -C server seed:e2e

# Ensure the built Admin SPA talks to the local server (same-origin) during E2E.
# Otherwise `vite build` defaults to `.env.production`, which points at prod APIs.
VITE_NIMBUS_API_URL= VITE_API_URL= VITE_APP_ENV=test npx -y pnpm -C apps/admin build

PORT="${PORT}" NODE_ENV=test npx -y pnpm -C server dev >"${SERVER_LOG}" 2>&1 &

for _ in $(seq 1 80); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/status" || true)
  if [[ "$code" == "200" ]]; then
    echo "server ready (${BASE_URL})"
    break
  fi
  sleep 0.5
  code="${code:-}"
done

if [[ "${code:-}" != "200" ]]; then
  echo "server not ready (status=${code:-})"
  tail -n 200 "${SERVER_LOG}" || true
  exit 1
fi

E2E_BASE_URL="${BASE_URL}" npx -y pnpm -C apps/admin exec playwright test "$@"
