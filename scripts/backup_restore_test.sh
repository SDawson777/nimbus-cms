#!/usr/bin/env bash
set -euo pipefail

echo "Starting backup/restore test"

# Note: this script tolerates placeholder values so it can be run as a CI manual dispatch.
# If you provide real secrets, the restores will run. If placeholders or empty values are
# present the related steps will be skipped.

PLACEHOLDER_TOKEN=${PLACEHOLDER_TOKEN:-"PLACEHOLDER"}

if [ -z "${SANITY_ADMIN_TOKEN:-}" ] || [ "${SANITY_ADMIN_TOKEN:-}" = "PLACEHOLDER" ]; then
  echo "SANITY_ADMIN_TOKEN not provided or placeholder — Sanity import steps will be skipped unless SANITY_EXPORT_TARBALL_URL is provided and a valid token is set."
fi

if [ -z "${POSTGRES_TEST_URL:-}" ] || [ "${POSTGRES_TEST_URL:-}" = "PLACEHOLDER" ]; then
  echo "POSTGRES_TEST_URL not provided or placeholder — Postgres restore steps will be skipped unless POSTGRES_DUMP_URL is provided and POSTGRES_TEST_URL is set."
fi

WORKDIR=$(mktemp -d)
echo "Workdir: $WORKDIR"
cd "$WORKDIR"

# Optional: restore Postgres if POSTGRES_DUMP_URL provided
if [ -n "${POSTGRES_DUMP_URL:-}" ]; then
  if [ -z "${POSTGRES_TEST_URL:-}" ] || [ "${POSTGRES_TEST_URL:-}" = "PLACEHOLDER" ]; then
    echo "POSTGRES_DUMP_URL provided but POSTGRES_TEST_URL is not set or is placeholder — cannot restore Postgres. Aborting."
    exit 1
  fi
  echo "Downloading Postgres dump from POSTGRES_DUMP_URL"
  curl -sS -O "$POSTGRES_DUMP_URL"
  DUMP_FILE=$(basename "$POSTGRES_DUMP_URL")
  echo "Restoring Postgres dump to $POSTGRES_TEST_URL"
  if command -v pg_restore >/dev/null 2>&1; then
    pg_restore --verbose --clean --no-acl --no-owner -d "$POSTGRES_TEST_URL" "$DUMP_FILE"
  else
    echo "pg_restore not found; trying psql (for plain SQL dumps)"
    if command -v gunzip >/dev/null 2>&1; then
      gunzip -c "$DUMP_FILE" | psql "$POSTGRES_TEST_URL"
    else
      echo "Neither pg_restore nor gunzip/psql found. Install Postgres client tools in runner."
      exit 1
    fi
  fi
else
  echo "POSTGRES_DUMP_URL not provided; skipping Postgres restore step"
fi

# Optional: restore Sanity dataset if SANITY_EXPORT_TARBALL_URL provided
if [ -n "${SANITY_EXPORT_TARBALL_URL:-}" ]; then
  if [ -z "${SANITY_ADMIN_TOKEN:-}" ] || [ "${SANITY_ADMIN_TOKEN:-}" = "PLACEHOLDER" ]; then
    echo "SANITY_EXPORT_TARBALL_URL provided but SANITY_ADMIN_TOKEN is not set or is placeholder — cannot import Sanity dataset. Aborting."
    exit 1
  fi
  echo "Installing sanity CLI"
  npm install -g @sanity/cli --no-fund --no-audit
  echo "Downloading Sanity export"
  curl -sS -O "$SANITY_EXPORT_TARBALL_URL"
  TARFILE=$(basename "$SANITY_EXPORT_TARBALL_URL")
  echo "Extracting and importing into dataset ${SANITY_TEST_DATASET:-nimbus_demo_test}"
  mkdir import && tar -xzf "$TARFILE" -C import
  echo "Running sanity dataset import (may require studio dependencies)"
  npx sanity dataset import import/*.ndjson "${SANITY_TEST_DATASET:-nimbus_demo_test}" --replace --project "${SANITY_STUDIO_PROJECT_ID:-}" --token "${SANITY_ADMIN_TOKEN}"
else
  echo "SANITY_EXPORT_TARBALL_URL not provided; skipping Sanity restore step"
fi

echo "Backup/restore script completed successfully"
