#!/bin/bash

# Enterprise-grade E2E test execution with full stack
# Starts backend + frontend, runs tests, captures results

set -e

echo "🚀 Starting Enterprise E2E Test Suite"
echo "======================================"

# Configuration
BACKEND_DIR="/Users/user288522/Documents/nimbus-cms/server"
FRONTEND_DIR="/Users/user288522/Documents/nimbus-cms/apps/admin"
BACKEND_PORT=8080
FRONTEND_PORT=5173

# Clean previous runs
cd "$FRONTEND_DIR"
rm -rf test-results playwright-report
echo "✅ Cleaned previous test results"

# Check if backend is running
if ! curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
  echo "❌ Backend not running on port $BACKEND_PORT"
  echo "Please start backend: cd server && npm start"
  exit 1
fi
echo "✅ Backend running on port $BACKEND_PORT"

# Check if frontend is running  
if ! curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
  echo "❌ Frontend not running on port $FRONTEND_PORT"
  echo "Please start frontend: cd apps/admin && npm run dev"
  exit 1
fi
echo "✅ Frontend running on port $FRONTEND_PORT"

# Run E2E tests
echo ""
echo "🎬 Running E2E Tests with Full Recording..."
echo "==========================================="

E2E_BASE_URL="http://localhost:$FRONTEND_PORT" \
E2E_ADMIN_EMAIL="e2e-admin@example.com" \
E2E_ADMIN_PASSWORD="TestPass123!" \
E2E_TENANT_ID="test-tenant" \
E2E_ORG_SLUG="e2e-org" \
npx playwright test --project=chromium --workers=3

# Show results
echo ""
echo "✅ Test run complete!"
echo "View results: cd $FRONTEND_DIR && npx playwright show-report"
