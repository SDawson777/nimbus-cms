#!/bin/bash

# Run E2E tests against live demo environment
# This script sets all required environment variables

echo "🌐 Running E2E tests against LIVE demo environment"
echo "URL: https://nimbus-admin-demo.vercel.app"
echo "Credentials: demo@nimbus.app"
echo ""

# Clean previous artifacts
rm -rf test-results playwright-report

# Set environment variables and run tests
E2E_BASE_URL='https://nimbus-admin-demo.vercel.app' \
E2E_ADMIN_EMAIL='demo@nimbus.app' \
E2E_ADMIN_PASSWORD='Nimbus!Demo123' \
E2E_TENANT_ID='test-tenant' \
E2E_ORG_SLUG='demo-org' \
npx playwright test --project=chromium

# Show results
echo ""
echo "✅ Test run complete!"
echo "View HTML report: npx playwright show-report"
echo "View trace: npx playwright show-trace test-results/*/trace.zip"
