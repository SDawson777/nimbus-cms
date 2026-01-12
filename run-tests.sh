#!/bin/bash
set -e

echo "🚀 Enterprise-Grade Test Suite Runner"
echo "======================================"
echo ""

# Kill any existing servers
echo "🧹 Cleaning up existing processes..."
pkill -f "pnpm dev" || true
pkill -f "vite preview" || true
pkill -f "tsx watch" || true
sleep 3

# Start backend
echo "📦 Starting backend server..."
cd /Users/user288522/Documents/nimbus-cms/server
NODE_ENV=development GLOBAL_RATE_LIMIT_MAX=0 ADMIN_LOGIN_RATE_LIMIT_MAX=0 /Users/user288522/Library/pnpm/pnpm dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
echo "⏳ Waiting for backend to start..."
for i in {1..40}; do
  if curl -s http://localhost:8080/api/v1/status > /dev/null 2>&1; then
    echo "✓ Backend ready on port 8080"
    break
  fi
  sleep 1
  if [ $i -eq 40 ]; then
    echo "❌ Backend failed to start"
    cat /tmp/backend.log | tail -50
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
  fi
done

# Start frontend
echo "🎨 Starting frontend server..."
cd /Users/user288522/Documents/nimbus-cms/apps/admin
/Users/user288522/Library/pnpm/pnpm exec vite preview --port 5174 --strictPort > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
echo "⏳ Waiting for frontend to start..."
for i in {1..20}; do
  if curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "✓ Frontend ready on port 5174"
    break
  fi
  sleep 1
  if [ $i -eq 20 ]; then
    echo "❌ Frontend failed to start on port 5174"
    cat /tmp/frontend.log | tail -30
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
  fi
done

# Run tests
echo ""
echo "🧪 Running E2E test suite..."
echo "======================================"
cd /Users/user288522/Documents/nimbus-cms/apps/admin
/Users/user288522/Library/pnpm/pnpm exec playwright test \
  --workers=2 \
  --reporter=list \
  --timeout=180000 \
  --retries=0 \
  2>&1 | tee /tmp/test-output.log

TEST_EXIT=$?

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true

if [ $TEST_EXIT -eq 0 ]; then
  echo ""
  echo "✅ ALL TESTS PASSED"
else
  echo ""
  echo "⚠️  Some tests failed (exit code: $TEST_EXIT)"
  echo "Check /tmp/test-output.log for details"
fi

exit $TEST_EXIT
