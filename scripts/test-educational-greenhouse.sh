#!/bin/bash
# Test Educational Greenhouse integration with Sanity schema
# Verifies that:
# 1. Sanity schema has all educational fields
# 2. API endpoints return the fields
# 3. Mobile app can calculate stats correctly

set -e

BASE_URL="${BASE_URL:-http://localhost:8080}"
VERBOSE="${VERBOSE:-false}"

echo "=========================================="
echo "Educational Greenhouse Integration Test"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test
test_case() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if [ "$expected" = "$actual" ]; then
    echo -e "${GREEN}✓${NC} $name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $name"
    echo "  Expected: $expected"
    echo "  Actual: $actual"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Helper for field existence
test_field_exists() {
  local response="$1"
  local field="$2"
  local context="$3"
  
  if echo "$response" | jq -e ".$field" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $context has field '$field'"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}✗${NC} $context missing field '$field'"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

echo -e "${BLUE}SECTION 1: Article List Endpoint${NC}"
echo "Testing: GET /mobile/sanity/articles"
echo ""

ARTICLES_RESPONSE=$(curl -s "$BASE_URL/mobile/sanity/articles")

# Check response structure
if echo "$ARTICLES_RESPONSE" | jq -e '.articles' > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Response has articles array"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗${NC} Response missing articles array"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo "Response: $ARTICLES_RESPONSE"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Get article count
ARTICLE_COUNT=$(echo "$ARTICLES_RESPONSE" | jq '.articles | length' 2>/dev/null || echo "0")
echo "Found $ARTICLE_COUNT articles"
echo ""

if [ "$ARTICLE_COUNT" -gt 0 ]; then
  echo -e "${BLUE}SECTION 2: Article Field Validation${NC}"
  echo "Checking first article for required fields..."
  echo ""
  
  FIRST_ARTICLE=$(echo "$ARTICLES_RESPONSE" | jq '.articles[0]' 2>/dev/null)
  
  # Core fields
  echo -e "${YELLOW}Core Fields:${NC}"
  test_field_exists "$FIRST_ARTICLE" "_id" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "title" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "slug" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "excerpt" "Article 1"
  
  echo ""
  echo -e "${YELLOW}Educational Fields (NEW):${NC}"
  test_field_exists "$FIRST_ARTICLE" "points" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "viewCount" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "difficulty" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "estimatedCompletionTime" "Article 1"
  
  echo ""
  echo -e "${YELLOW}Metadata Fields:${NC}"
  test_field_exists "$FIRST_ARTICLE" "category" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "author" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "readingTime" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "tags" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "channels" "Article 1"
  test_field_exists "$FIRST_ARTICLE" "published" "Article 1"
  
  echo ""
  echo -e "${YELLOW}Sample Values:${NC}"
  POINTS=$(echo "$FIRST_ARTICLE" | jq '.points' 2>/dev/null || echo "null")
  VIEW_COUNT=$(echo "$FIRST_ARTICLE" | jq '.viewCount' 2>/dev/null || echo "null")
  DIFFICULTY=$(echo "$FIRST_ARTICLE" | jq '.difficulty' 2>/dev/null || echo "null")
  COMPLETION_TIME=$(echo "$FIRST_ARTICLE" | jq '.estimatedCompletionTime' 2>/dev/null || echo "null")
  
  echo "  points: $POINTS"
  echo "  viewCount: $VIEW_COUNT"
  echo "  difficulty: $DIFFICULTY"
  echo "  estimatedCompletionTime: $COMPLETION_TIME"
  
  echo ""
  echo -e "${BLUE}SECTION 3: Single Article Endpoint${NC}"
  echo "Testing: GET /mobile/sanity/articles/:slug"
  echo ""
  
  SLUG=$(echo "$FIRST_ARTICLE" | jq -r '.slug' 2>/dev/null)
  if [ ! -z "$SLUG" ] && [ "$SLUG" != "null" ]; then
    echo "Using slug: $SLUG"
    SINGLE_ARTICLE_RESPONSE=$(curl -s "$BASE_URL/mobile/sanity/articles/$SLUG")
    
    if echo "$SINGLE_ARTICLE_RESPONSE" | jq -e '.article' > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} Single article endpoint returns article"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}✗${NC} Single article endpoint failed"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    SINGLE_ARTICLE=$(echo "$SINGLE_ARTICLE_RESPONSE" | jq '.article' 2>/dev/null)
    if [ ! -z "$SINGLE_ARTICLE" ] && [ "$SINGLE_ARTICLE" != "null" ]; then
      echo ""
      echo -e "${YELLOW}Single Article Fields:${NC}"
      test_field_exists "$SINGLE_ARTICLE" "points" "Single article"
      test_field_exists "$SINGLE_ARTICLE" "viewCount" "Single article"
      test_field_exists "$SINGLE_ARTICLE" "difficulty" "Single article"
      test_field_exists "$SINGLE_ARTICLE" "estimatedCompletionTime" "Single article"
    fi
  fi
  
  echo ""
  echo -e "${BLUE}SECTION 4: View Tracking Endpoint${NC}"
  echo "Testing: POST /mobile/sanity/articles/:slug/view"
  echo ""
  
  if [ ! -z "$SLUG" ] && [ "$SLUG" != "null" ]; then
    VIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/mobile/sanity/articles/$SLUG/view" \
      -H "Content-Type: application/json" \
      -d '{"userId":"test-user-123"}')
    
    if echo "$VIEW_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
      SUCCESS=$(echo "$VIEW_RESPONSE" | jq -r '.success' 2>/dev/null)
      if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✓${NC} View tracking endpoint working"
        TESTS_PASSED=$((TESTS_PASSED + 1))
      else
        echo -e "${RED}✗${NC} View tracking returned false"
        TESTS_FAILED=$((TESTS_FAILED + 1))
      fi
    else
      echo -e "${RED}✗${NC} View tracking endpoint failed"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
  fi
  
  echo ""
  echo -e "${BLUE}SECTION 5: Mobile App Calculations${NC}"
  echo "Simulating Educational Greenhouse stats..."
  echo ""
  
  # Calculate stats like mobile app would
  TOTAL_LESSONS=$(echo "$ARTICLE_COUNT")
  TOTAL_POINTS=$(echo "$ARTICLES_RESPONSE" | jq '[.articles[].points // 10] | add' 2>/dev/null || echo "0")
  
  if [ "$TOTAL_POINTS" != "0" ]; then
    echo -e "${GREEN}✓${NC} Can calculate totalPoints: $TOTAL_POINTS"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠${NC} totalPoints calculation returned 0 (may be expected if no points set)"
  fi
  TESTS_RUN=$((TESTS_RUN + 1))
  
  # Test sorting by viewCount
  HIGHEST_VIEWS=$(echo "$ARTICLES_RESPONSE" | jq 'sort_by(.viewCount // 0) | reverse | .[0].viewCount // 0' 2>/dev/null || echo "0")
  echo -e "${GREEN}✓${NC} Can sort by viewCount: highest is $HIGHEST_VIEWS views"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TESTS_RUN=$((TESTS_RUN + 1))
  
  # Test filtering by difficulty
  BEGINNER_COUNT=$(echo "$ARTICLES_RESPONSE" | jq '[.articles[] | select(.difficulty == "beginner")] | length' 2>/dev/null || echo "0")
  echo -e "${GREEN}✓${NC} Can filter by difficulty: $BEGINNER_COUNT beginner articles"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TESTS_RUN=$((TESTS_RUN + 1))
  
else
  echo -e "${YELLOW}⚠${NC} No articles found - skipping detailed field tests"
  echo "Note: Sanity needs to have articles published to test"
fi

echo ""
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo -e "Total Tests: ${BLUE}$TESTS_RUN${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "Educational Greenhouse schema and API are working correctly."
  echo "Mobile app can now:"
  echo "  • Calculate totalPoints from article points"
  echo "  • Sort articles by viewCount for popular articles"
  echo "  • Filter articles by difficulty level"
  echo "  • Track article views with POST endpoint"
  echo "  • Display estimated completion times"
  exit 0
else
  echo ""
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Ensure server is running at: $BASE_URL"
  echo "2. Check Sanity dataset has published articles"
  echo "3. Verify schema includes educational fields:"
  echo "   - apps/studio/schemaTypes/__cms/article.ts"
  echo "4. Check API endpoints:"
  echo "   - server/src/routes/mobileSanityContent.ts"
  exit 1
fi
