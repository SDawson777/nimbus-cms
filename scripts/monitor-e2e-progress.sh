#!/bin/bash
# Monitor E2E test progress in real-time

LOG_FILE="/tmp/e2e-full-run.log"

echo "🔍 Monitoring E2E Test Execution..."
echo "Log file: $LOG_FILE"
echo ""

while true; do
    clear
    echo "======================================"
    echo "📊 E2E Test Progress Monitor"
    echo "======================================"
    echo ""
    
    # Count passed/failed tests
    PASSED=$(grep -c "✓" "$LOG_FILE" 2>/dev/null || echo "0")
    FAILED=$(grep -c "✘" "$LOG_FILE" 2>/dev/null || echo "0")
    TOTAL=89
    
    echo "Status:"
    echo "  ✅ Passed: $PASSED"
    echo "  ❌ Failed: $FAILED"
    echo "  📝 Total:  $TOTAL"
    echo ""
    
    # Show last 20 lines
    echo "Recent output:"
    echo "--------------------------------------"
    tail -20 "$LOG_FILE" 2>/dev/null || echo "Waiting for output..."
    echo "--------------------------------------"
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    
    sleep 5
done
