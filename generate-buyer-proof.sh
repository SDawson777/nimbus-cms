#!/bin/bash
# Quick E2E Evidence Generator
# Minimal version - just runs tests and packages results

echo "🎬 Nimbus CMS - E2E Evidence Generator"
echo "====================================="
echo ""

# Check if we're in the right place
if [ ! -d "apps/admin" ] || [ ! -d "server" ]; then
    echo "❌ Error: Must run from workspace root (/workspaces/nimbus-cms)"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check if backend is running
echo "Checking backend server on port 8080..."
if ! curl -s http://localhost:8080/login > /dev/null 2>&1 && \
   ! curl -s http://localhost:8080/healthz > /dev/null 2>&1; then
    echo ""
    echo "❌ Backend server not running on port 8080"
    echo ""
    echo "Please start the backend first:"
    echo ""
    echo "  cd server"
    echo "  PORT=8080 pnpm run dev"
    echo ""
    echo "Then run this script again."
    echo ""
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Go to admin directory
cd apps/admin

# Clean old artifacts
echo "Cleaning old artifacts..."
rm -rf demo-artifacts test-results playwright-report 2>/dev/null || true
echo "✅ Clean complete"
echo ""

# Run tests
echo "Running E2E tests (this will take 20-45 minutes)..."
echo "Progress shown below:"
echo "──────────────────────────────────────────────────"
echo ""

# Ensure full video/trace capture
unset CI

# Run tests
E2E_BASE_URL="http://localhost:8080" \
E2E_ADMIN_EMAIL="e2e-admin@example.com" \
E2E_ADMIN_PASSWORD="e2e-password" \
E2E_ADMIN_SECONDARY_EMAIL="e2e-editor@example.com" \
E2E_ADMIN_SECONDARY_PASSWORD="e2e-editor-pass" \
pnpm exec playwright test --workers=1 --reporter=list,html

TEST_EXIT_CODE=$?

echo ""
echo "──────────────────────────────────────────────────"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Some tests had issues (exit code: $TEST_EXIT_CODE)"
    echo "   Continuing with packaging..."
fi
echo ""

# Count evidence
echo "Analyzing generated evidence..."
VIDEO_COUNT=$(find demo-artifacts test-results -name "*.webm" 2>/dev/null | wc -l | tr -d ' ')
SCREENSHOT_COUNT=$(find demo-artifacts test-results -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
echo "   Videos: $VIDEO_COUNT"
echo "   Screenshots: $SCREENSHOT_COUNT"
echo ""

# Create package
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="../nimbus-e2e-buyer-proof-${TIMESTAMP}.tar.gz"

echo "Creating buyer proof package..."
tar -czf "$PACKAGE_NAME" \
    demo-artifacts \
    test-results \
    playwright-report \
    *.md \
    2>/dev/null

if [ -f "$PACKAGE_NAME" ]; then
    PACKAGE_SIZE=$(du -sh "$PACKAGE_NAME" | cut -f1)
    echo "✅ Package created successfully"
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "🎉 Evidence Package Ready!"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📦 Package: $(basename $PACKAGE_NAME)"
    echo "📊 Size: $PACKAGE_SIZE"
    echo "🎥 Videos: $VIDEO_COUNT"
    echo "📸 Screenshots: $SCREENSHOT_COUNT"
    echo ""
    echo "📂 Location: $PACKAGE_NAME"
    echo ""
    echo "Next steps:"
    echo "  1. View results: pnpm run e2e:report"
    echo "  2. Extract package: tar -xzf $PACKAGE_NAME -C /tmp/evidence"
    echo "  3. Share with buyers: Upload to cloud storage"
    echo ""
else
    echo "❌ Failed to create package"
    exit 1
fi

exit $TEST_EXIT_CODE
