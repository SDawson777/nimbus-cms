#!/bin/bash
# Verification script for deployment and CI fixes

set -e

echo "🔍 Verifying Deployment & CI Fixes..."
echo ""

# Check 1: Verify pnpm-lock.yaml exists and is committed
echo "1️⃣ Checking pnpm-lock.yaml..."
if git ls-files | grep -q "^pnpm-lock.yaml$"; then
    echo "   ✅ pnpm-lock.yaml is committed"
else
    echo "   ❌ pnpm-lock.yaml not found in git"
    exit 1
fi

# Check 2: Verify vercel.json exists
echo "2️⃣ Checking vercel.json..."
if [ -f "vercel.json" ]; then
    echo "   ✅ vercel.json exists"
    if grep -q "prefer-offline" vercel.json; then
        echo "   ✅ vercel.json has optimized install command"
    fi
else
    echo "   ❌ vercel.json not found"
    exit 1
fi

# Check 3: Verify optimized workflow exists
echo "3️⃣ Checking GitHub workflows..."
if [ -f ".github/workflows/enterprise-checks.yml" ]; then
    echo "   ✅ enterprise-checks.yml exists"
else
    echo "   ❌ enterprise-checks.yml not found"
    exit 1
fi

if [ -f ".github/workflows/nightly-full-suite.yml" ]; then
    echo "   ✅ nightly-full-suite.yml exists"
else
    echo "   ❌ nightly-full-suite.yml not found"
    exit 1
fi

# Check 4: Verify package.json has smoke test script
echo "4️⃣ Checking package.json scripts..."
if grep -q "e2e:smoke" apps/admin/package.json; then
    echo "   ✅ Smoke test script exists"
else
    echo "   ❌ Smoke test script not found"
    exit 1
fi

# Check 5: Test pnpm install with frozen lockfile
echo "5️⃣ Testing pnpm install..."
if npx pnpm install --frozen-lockfile --prefer-offline > /dev/null 2>&1; then
    echo "   ✅ pnpm install works with frozen lockfile"
else
    echo "   ❌ pnpm install failed"
    exit 1
fi

# Check 6: Verify critical test files exist
echo "6️⃣ Verifying smoke test files..."
SMOKE_TESTS=(
    "apps/admin/tests/flow-01-login.spec.ts"
    "apps/admin/tests/flow-02-navigation.spec.ts"
    "apps/admin/tests/flow-03-analytics.spec.ts"
    "apps/admin/tests/flow-04-theme.spec.ts"
    "apps/admin/tests/flow-05-admin-users.spec.ts"
)

for test in "${SMOKE_TESTS[@]}"; do
    if [ -f "$test" ]; then
        echo "   ✅ $(basename $test) exists"
    else
        echo "   ❌ $(basename $test) not found"
        exit 1
    fi
done

echo ""
echo "🎉 All verification checks passed!"
echo ""
echo "Summary of optimizations:"
echo "  • Vercel: Configured with frozen lockfile and prefer-offline"
echo "  • CI: Split into smoke tests (~15min) and nightly full suite (~60min)"
echo "  • Tests: 5 critical flows for quick feedback, 36 flows for comprehensive coverage"
echo ""
echo "Next steps:"
echo "  1. Commit changes: git add -A && git commit -m 'fix: Optimize CI and Vercel deployment'"
echo "  2. Push to GitHub: git push origin main"
echo "  3. Monitor deployments:"
echo "     • Vercel: https://vercel.com/dashboard"
echo "     • GitHub Actions: https://github.com/SDawson777/nimbus-cms/actions"
echo "  4. First nightly run: Tomorrow at 2 AM UTC"
echo ""
