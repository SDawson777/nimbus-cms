#!/bin/bash

# Mobile API Diagnostic Tool
# Tests all Sanity endpoints to verify backend is working

API_URL="https://nimbus-api-demo.up.railway.app"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Mobile API Sanity Endpoint Diagnostics"
echo "======================================"
echo ""
echo "Testing API: $API_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected_key=$2
    
    printf "Testing %-40s ... " "$endpoint"
    
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        # Check if response has expected key
        if echo "$body" | jq -e ".$expected_key" > /dev/null 2>&1; then
            count=$(echo "$body" | jq ".$expected_key | length" 2>/dev/null || echo "N/A")
            echo -e "${GREEN}✓ OK${NC} (${count} items)"
        else
            echo -e "${YELLOW}⚠ OK but unexpected format${NC}"
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
    fi
}

# Test webhook health
printf "Testing %-40s ... " "/webhooks/health"
response=$(curl -s -w "\n%{http_code}" "$API_URL/webhooks/health")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
fi

echo ""
echo "Core Content Endpoints:"
echo "----------------------"

# Test all key endpoints
test_endpoint "/mobile/sanity/all" "articles"
test_endpoint "/mobile/sanity/articles" "articles"
test_endpoint "/mobile/sanity/products" "products"
test_endpoint "/mobile/sanity/faq" "faqs"
test_endpoint "/mobile/sanity/banners" "banners"
test_endpoint "/mobile/sanity/deals" "deals"
test_endpoint "/mobile/sanity/categories" "categories"
test_endpoint "/mobile/sanity/brands" "brands"
test_endpoint "/mobile/sanity/stores" "stores"

echo ""
echo "Additional Content:"
echo "------------------"

test_endpoint "/mobile/sanity/legal" "legal"
test_endpoint "/mobile/sanity/theme" "theme"
test_endpoint "/mobile/sanity/effects" "effects"
test_endpoint "/mobile/sanity/awards" "awards"
test_endpoint "/mobile/sanity/accessibility" "accessibility"

echo ""
echo "======================================"
echo "Comparison Test: Old vs New Endpoints"
echo "======================================"
echo ""

# Compare old vs new products endpoint
echo "Old endpoint (/mobile/content/products):"
curl -s "$API_URL/mobile/content/products" | jq '.products[0] | {id, name, brand, source: "PostgreSQL"}' 2>/dev/null || echo "Error fetching"

echo ""
echo "New endpoint (/mobile/sanity/products):"
curl -s "$API_URL/mobile/sanity/products" | jq '.products[0] | {_id, name, brand: .brand.name, source: "Sanity CMS"}' 2>/dev/null || echo "Error fetching"

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo -e "${YELLOW}If all endpoints show ✓ OK:${NC}"
echo "  → Backend is working correctly"
echo "  → Update mobile app to use /mobile/sanity/* endpoints"
echo "  → See MOBILE_API_MIGRATION_GUIDE.md for details"
echo ""
echo -e "${YELLOW}If any endpoints show ✗ FAILED:${NC}"
echo "  → Check Railway deployment status"
echo "  → Verify latest code is deployed"
echo "  → Check server logs for errors"
echo ""
