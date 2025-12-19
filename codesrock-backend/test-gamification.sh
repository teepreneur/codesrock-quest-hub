#!/bin/bash

echo "========================================"
echo "Testing CodesRock Gamification API"
echo "========================================"
echo ""

BASE_URL="http://localhost:5000/api"

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | grep -o '"success":true' && echo "✓ Health check passed" || echo "✗ Health check failed"
echo ""

# Test 2: Login
echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@codesrock.org","password":"Codesrock2024"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"_id":"[^"]*' | sed 's/"_id":"//')

if [ -z "$TOKEN" ]; then
  echo "✗ Login failed - no token received"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Login successful"
echo "User ID: $USER_ID"
echo ""

# Test 3: Get All Levels
echo "3. Testing GET /levels..."
curl -s "$BASE_URL/levels" \
  -H "Authorization: Bearer $TOKEN" | head -c 100
echo "..."
echo ""

# Test 4: Get User Progress
echo "4. Testing GET /progress/:userId..."
curl -s "$BASE_URL/progress/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | head -c 150
echo "..."
echo ""

# Test 5: Get All Badges
echo "5. Testing GET /badges..."
curl -s "$BASE_URL/badges" \
  -H "Authorization: Bearer $TOKEN" | head -c 100
echo "..."
echo ""

# Test 6: Add XP
echo "6. Testing POST /progress/xp..."
curl -s -X POST "$BASE_URL/progress/xp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"amount\":50,\"description\":\"Test XP award\",\"metadata\":{\"test\":true}}" | head -c 150
echo "..."
echo ""

# Test 7: Get Leaderboard
echo "7. Testing GET /leaderboard..."
curl -s "$BASE_URL/leaderboard" \
  -H "Authorization: Bearer $TOKEN" | head -c 150
echo "..."
echo ""

# Test 8: Get Activity Feed
echo "8. Testing GET /activities/:userId..."
curl -s "$BASE_URL/activities/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | head -c 150
echo "..."
echo ""

# Test 9: Update Streak
echo "9. Testing POST /progress/streak..."
curl -s -X POST "$BASE_URL/progress/streak" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\"}" | head -c 150
echo "..."
echo ""

echo "========================================"
echo "All tests completed!"
echo "========================================"
