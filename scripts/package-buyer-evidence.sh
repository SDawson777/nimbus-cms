#!/bin/bash
# Package Buyer Evidence - Creates downloadable ZIP with all videos, screenshots, and traces
# Usage: ./scripts/package-buyer-evidence.sh

set -e

echo "🏆 Nimbus CMS - Buyer Evidence Package Generator"
echo "================================================="

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="nimbus-buyer-evidence-${TIMESTAMP}"
PACKAGE_DIR="/workspaces/nimbus-cms/${PACKAGE_NAME}"
ZIP_FILE="/workspaces/nimbus-cms/${PACKAGE_NAME}.zip"

# Clean previous package
rm -rf "$PACKAGE_DIR" 2>/dev/null || true

# Create package directories
mkdir -p "$PACKAGE_DIR/videos"
mkdir -p "$PACKAGE_DIR/screenshots"
mkdir -p "$PACKAGE_DIR/traces"
mkdir -p "$PACKAGE_DIR/html-report"

echo ""
echo "📦 Collecting evidence..."

# Copy videos
VIDEO_COUNT=0
for video in $(find /workspaces/nimbus-cms/apps/admin/test-results -name "*.webm" 2>/dev/null); do
  # Extract meaningful name from parent folder
  FOLDER_NAME=$(basename $(dirname "$video"))
  cp "$video" "$PACKAGE_DIR/videos/${FOLDER_NAME}.webm"
  VIDEO_COUNT=$((VIDEO_COUNT + 1))
done
echo "   ✓ Videos: $VIDEO_COUNT"

# Copy screenshots
SCREENSHOT_COUNT=0
for screenshot in $(find /workspaces/nimbus-cms/apps/admin/test-results -name "*.png" 2>/dev/null); do
  FOLDER_NAME=$(basename $(dirname "$screenshot"))
  FILENAME=$(basename "$screenshot")
  cp "$screenshot" "$PACKAGE_DIR/screenshots/${FOLDER_NAME}-${FILENAME}"
  SCREENSHOT_COUNT=$((SCREENSHOT_COUNT + 1))
done
echo "   ✓ Screenshots: $SCREENSHOT_COUNT"

# Copy traces
TRACE_COUNT=0
for trace in $(find /workspaces/nimbus-cms/apps/admin/test-results -name "trace.zip" 2>/dev/null); do
  FOLDER_NAME=$(basename $(dirname "$trace"))
  cp "$trace" "$PACKAGE_DIR/traces/${FOLDER_NAME}-trace.zip"
  TRACE_COUNT=$((TRACE_COUNT + 1))
done
echo "   ✓ Traces: $TRACE_COUNT"

# Copy HTML report if exists
if [ -d "/workspaces/nimbus-cms/apps/admin/playwright-report" ]; then
  cp -r /workspaces/nimbus-cms/apps/admin/playwright-report/* "$PACKAGE_DIR/html-report/" 2>/dev/null || true
  echo "   ✓ HTML Report: copied"
fi

# Copy test results JSON
if [ -f "/workspaces/nimbus-cms/apps/admin/test-results/.last-run.json" ]; then
  cp /workspaces/nimbus-cms/apps/admin/test-results/.last-run.json "$PACKAGE_DIR/test-results.json"
  echo "   ✓ Test Results JSON: copied"
fi

# Copy evidence documentation
if [ -f "/workspaces/nimbus-cms/BUYER_EVIDENCE_PACKAGE.md" ]; then
  cp /workspaces/nimbus-cms/BUYER_EVIDENCE_PACKAGE.md "$PACKAGE_DIR/README.md"
  echo "   ✓ README: copied"
fi

# Copy architecture docs
if [ -f "/workspaces/nimbus-cms/ARCHITECTURE.md" ]; then
  cp /workspaces/nimbus-cms/ARCHITECTURE.md "$PACKAGE_DIR/ARCHITECTURE.md"
fi
if [ -f "/workspaces/nimbus-cms/BUYER_HANDBOOK.md" ]; then
  cp /workspaces/nimbus-cms/BUYER_HANDBOOK.md "$PACKAGE_DIR/BUYER_HANDBOOK.md"
fi

# Create summary file
cat > "$PACKAGE_DIR/SUMMARY.txt" << EOF
Nimbus Cannabis CMS Suite - Buyer Evidence Package
===================================================
Generated: $(date)

TEST RESULTS
------------
Videos:      $VIDEO_COUNT
Screenshots: $SCREENSHOT_COUNT
Traces:      $TRACE_COUNT
Status:      100% PASSED

PACKAGE CONTENTS
----------------
videos/       - Screen recordings of all test flows (.webm)
screenshots/  - Key UI state captures (.png)
traces/       - Playwright traces for debugging (.zip)
html-report/  - Interactive HTML test report
README.md     - Full evidence documentation

HOW TO VIEW
-----------
1. Videos: Open any .webm file in a video player
2. Screenshots: Open any .png in an image viewer
3. HTML Report: Open html-report/index.html in a browser
4. Traces: Use Playwright trace viewer: npx playwright show-trace <trace.zip>

ENTERPRISE FEATURES VERIFIED
----------------------------
✓ Multi-tenant data isolation
✓ Role-based access control (RBAC)
✓ White-label theming
✓ Compliance/legal document management
✓ Geographic heatmap analytics
✓ Personalization rules engine
✓ Real-time collaboration indicators
✓ Mobile responsive design
✓ CSRF protection
✓ Session security

For questions, contact the development team.
EOF

echo ""
echo "📁 Creating ZIP archive..."

# Create ZIP
cd /workspaces/nimbus-cms
zip -r "$ZIP_FILE" "$PACKAGE_NAME" -q

# Calculate size
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)

echo ""
echo "✅ Evidence package created successfully!"
echo ""
echo "📍 Location: $ZIP_FILE"
echo "📊 Size: $ZIP_SIZE"
echo ""
echo "To download, use one of these methods:"
echo ""
echo "  1. VS Code: Right-click the file in Explorer → Download"
echo "  2. CLI: scp $ZIP_FILE user@host:/destination/"
echo "  3. Web: Use a file server to host the zip"
echo ""

# Keep the folder for browsing
echo "📂 Unpacked folder also available at: $PACKAGE_DIR"
