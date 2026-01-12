#!/bin/bash
cd /Users/user288522/Documents/nimbus-cms

# Start backend
cd server
/Users/user288522/Library/pnpm/pnpm dev &
BACKEND_PID=$!
echo "Backend started: $BACKEND_PID"

# Start frontend 
cd ../apps/admin
/Users/user288522/Library/pnpm/pnpm exec vite preview --port 5174 &
FRONTEND_PID=$!
echo "Frontend started: $FRONTEND_PID"

echo "Servers running. Press Ctrl+C to stop."
wait
