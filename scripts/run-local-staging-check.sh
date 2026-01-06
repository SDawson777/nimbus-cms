#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

# Prefer pnpm if installed; otherwise use npx-pinned pnpm.
pnpm_cmd() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
  else
    npx -y pnpm@9.15.0 "$@"
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed (or not on PATH)." >&2
  echo "Install Docker Desktop and retry." >&2
  exit 127
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required (docker compose ...)." >&2
  exit 127
fi

require_cmd node
require_cmd npm

cd "$ROOT_DIR"

echo "==> Installing dependencies (pnpm workspace)"
pnpm_cmd install --frozen-lockfile

echo "==> Starting Postgres + Redis + API via docker compose"
docker compose -f infra/docker-compose.yml up --build -d

echo "==> Waiting briefly for Postgres to accept connections"
sleep 2

echo "==> Running Prisma migrations + seed (uses DATABASE_URL env)"
# Use the same DATABASE_URL the compose file defaults to.
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/nimbus?schema=public}"
# Server reads DATABASE_URL; seed uses prisma schema at prisma/schema.prisma
pnpm_cmd exec prisma migrate deploy
pnpm_cmd prisma:seed

echo "==> Running smoke check against local API"
pnpm_cmd smoke:check -- "http://localhost:4010"

echo "OK: local staging loop passed"