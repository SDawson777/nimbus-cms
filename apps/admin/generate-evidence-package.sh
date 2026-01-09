#!/bin/bash
# Generate comprehensive E2E evidence package for buyer demonstrations

set -e

echo "🎬 Nimbus CMS - E2E Evidence Package Generator"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "tests" ]; then
    echo -e "${RED}❌ Error: Must run from apps/admin directory${NC}"
    echo "Usage: cd apps/admin && ./generate-evidence-package.sh"
    exit 1
fi

# Check if backend is running
echo "1️⃣ Checking backend server..."
if curl -s http://localhost:8080/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not responding on port 8080${NC}"
    echo ""
    echo "Please start the backend server first:"
    echo "  cd server && pnpm run dev"
    echo ""
    read -p "Press Enter once backend is running, or Ctrl+C to cancel..."
fi

# Clean old artifacts
echo ""
echo "2️⃣ Cleaning old artifacts..."
rm -rf demo-artifacts test-results playwright-report
echo -e "${GREEN}✅ Old artifacts removed${NC}"

# Run full test suite
echo ""
echo "3️⃣ Running full E2E test suite (36 flows)..."
echo "   This will take approximately 45 minutes..."
echo "   Progress will be shown below:"
echo ""

# Unset CI to enable full recording
unset CI

if pnpm run e2e:evidence; then
    echo ""
    echo -e "${GREEN}✅ All tests completed successfully${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests may have failed. Check results.${NC}"
    echo "   Continuing with package creation..."
fi

# Check what was generated
echo ""
echo "4️⃣ Verifying generated artifacts..."

DEMO_ARTIFACTS_SIZE=$(du -sh demo-artifacts 2>/dev/null | cut -f1 || echo "0")
TEST_RESULTS_SIZE=$(du -sh test-results 2>/dev/null | cut -f1 || echo "0")
PLAYWRIGHT_REPORT_SIZE=$(du -sh playwright-report 2>/dev/null | cut -f1 || echo "0")

echo "   demo-artifacts:    $DEMO_ARTIFACTS_SIZE"
echo "   test-results:      $TEST_RESULTS_SIZE"
echo "   playwright-report: $PLAYWRIGHT_REPORT_SIZE"

# Count videos and traces
VIDEO_COUNT=$(find test-results demo-artifacts -name "*.webm" 2>/dev/null | wc -l | xargs)
TRACE_COUNT=$(find test-results demo-artifacts -name "*.zip" 2>/dev/null | wc -l | xargs)

echo "   Videos:            $VIDEO_COUNT"
echo "   Traces:            $TRACE_COUNT"

if [ "$VIDEO_COUNT" -lt 30 ]; then
    echo -e "${YELLOW}⚠️  Warning: Expected ~36 videos, found $VIDEO_COUNT${NC}"
fi

# Create package
echo ""
echo "5️⃣ Creating downloadable package..."

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="../nimbus-e2e-evidence-${TIMESTAMP}.tar.gz"

tar -czf "$PACKAGE_NAME" \
    demo-artifacts \
    test-results \
    playwright-report \
    *.md \
    E2E_EVIDENCE_README.md \
    ../docs/LOCAL_E2E_TESTING.md \
    COMPLETE_BUYER_PACKAGE_MASTER_INDEX.md \
    ENHANCED_VISUAL_PROOF_TESTS_SUMMARY.md \
    STRATEGIC_ENTERPRISE_FLOWS_SUMMARY.md \
    2>/dev/null || true

if [ -f "$PACKAGE_NAME" ]; then
    PACKAGE_SIZE=$(du -sh "$PACKAGE_NAME" | cut -f1)
    echo -e "${GREEN}✅ Package created: $PACKAGE_NAME${NC}"
    echo "   Size: $PACKAGE_SIZE"
else
    echo -e "${RED}❌ Failed to create package${NC}"
    exit 1
fi

# Verify package contents
echo ""
echo "6️⃣ Verifying package contents..."
TAR_FILE_COUNT=$(tar -tzf "$PACKAGE_NAME" | wc -l | xargs)
echo "   Files in package: $TAR_FILE_COUNT"

# Generate summary
echo ""
echo "=============================================="
echo "🎉 Evidence Package Generation Complete!"
echo "=============================================="
echo ""
echo "📦 Package Details:"
echo "   Location: $PACKAGE_NAME"
echo "   Size:     $PACKAGE_SIZE"
echo "   Files:    $TAR_FILE_COUNT"
echo "   Videos:   $VIDEO_COUNT"
echo "   Traces:   $TRACE_COUNT"
echo ""
echo "📊 Next Steps:"
echo ""
echo "1. View HTML Report:"
echo "   pnpm run e2e:report"
echo ""
echo "2. Extract Package:"
echo "   tar -xzf $PACKAGE_NAME -C /tmp/evidence-review"
echo ""
echo "3. Upload for Buyer:"
echo "   aws s3 cp $PACKAGE_NAME s3://buyer-packages/"
echo "   # Or use Dropbox, Google Drive, etc."
echo ""
echo "4. Verify Package:"
echo "   tar -tzf $PACKAGE_NAME | head -20"
echo ""
echo "📝 Documentation:"
echo "   See docs/LOCAL_E2E_TESTING.md for complete guide"
echo ""

# Optional: Open HTML report
echo "Would you like to view the HTML report now? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    pnpm run e2e:report
fi

echo ""
echo "✅ Done!"
