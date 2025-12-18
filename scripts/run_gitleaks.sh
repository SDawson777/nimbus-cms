#!/usr/bin/env bash
set -euo pipefail

# Local helper to run gitleaks locally if you have it installed.
# Usage: ./scripts/run_gitleaks.sh
# Requires gitleaks to be installed: https://github.com/zricethezav/gitleaks

if command -v gitleaks >/dev/null 2>&1; then
  echo "Running gitleaks detect against current repo..."
  gitleaks detect --source . --redact
  echo "gitleaks finished: no leaks detected (exit 0)."
else
  echo "gitleaks is not installed locally."
  echo "To run locally, install gitleaks (https://github.com/zricethezav/gitleaks) or run the CI job by opening a PR." 
  exit 0
fi
