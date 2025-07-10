#!/bin/bash

# Comprehensive QA Test Script for Chrysalis Mindfulness App
# This script tests all core functionality to ensure production readiness

echo "🧘 Starting Comprehensive QA Test for Chrysalis Mindfulness App"
echo "=================================================="

# Test API endpoints
API_BASE="https://chrysalis-presence-app.netlify.app/.netlify/functions"
LOCAL_API="http://localhost:3001/.netlify/functions"

echo ""
echo "1. Testing API Health & Connectivity"
echo "------------------------------------"

# Test registration endpoint
echo "Testing registration endpoint..."
REGISTRATION_RESPONSE=$(curl -s -X POST "$API_BASE/auth-register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "qatest@example.com",
    "password": "testpassword",
    "displayName": "QA Test User"
  }' || echo "ERROR")

if [[ $REGISTRATION_RESPONSE == *"token"* ]]; then
  echo "✅ Registration endpoint working"
else
  echo "❌ Registration endpoint failed"
  echo "Response: $REGISTRATION_RESPONSE"
fi

# Test login endpoint
echo "Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth-login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "qatest@example.com",
    "password": "testpassword"
  }' || echo "ERROR")

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
  echo "✅ Login endpoint working"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  echo "❌ Login endpoint failed"
  echo "Response: $LOGIN_RESPONSE"
fi

# Test leaderboard endpoint
echo "Testing leaderboard endpoint..."
LEADERBOARD_RESPONSE=$(curl -s -X GET "$API_BASE/leaderboards-global" || echo "ERROR")

if [[ $LEADERBOARD_RESPONSE == *"["* ]]; then
  echo "✅ Leaderboard endpoint working"
else
  echo "❌ Leaderboard endpoint failed"
  echo "Response: $LEADERBOARD_RESPONSE"
fi

# Test wisdom quotes endpoint
echo "Testing wisdom quotes endpoint..."
WISDOM_RESPONSE=$(curl -s -X GET "$API_BASE/wisdom-quotes" || echo "ERROR")

if [[ $WISDOM_RESPONSE == *"text"* ]]; then
  echo "✅ Wisdom quotes endpoint working"
else
  echo "❌ Wisdom quotes endpoint failed"
  echo "Response: $WISDOM_RESPONSE"
fi

echo ""
echo "2. Testing Frontend Build"
echo "------------------------"

# Check if build directory exists and has content
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
  echo "✅ Build directory exists and has content"
  
  # Check for main files
  if [ -f "dist/index.html" ]; then
    echo "✅ index.html exists in build"
  else
    echo "❌ index.html missing from build"
  fi
  
  if ls dist/assets/*.js 1> /dev/null 2>&1; then
    echo "✅ JavaScript bundles exist"
  else
    echo "❌ JavaScript bundles missing"
  fi
  
  if ls dist/assets/*.css 1> /dev/null 2>&1; then
    echo "✅ CSS bundles exist"
  else
    echo "❌ CSS bundles missing"
  fi
else
  echo "❌ Build directory missing or empty"
fi

echo ""
echo "3. Testing Code Quality"
echo "----------------------"

# Check for TypeScript errors
echo "Checking TypeScript compilation..."
if npx tsc --noEmit > /dev/null 2>&1; then
  echo "✅ No TypeScript errors"
else
  echo "❌ TypeScript compilation errors found"
fi

# Check for ESLint errors
echo "Checking ESLint..."
if npx eslint src/ --ext .ts,.tsx > /dev/null 2>&1; then
  echo "✅ No ESLint errors"
else
  echo "❌ ESLint errors found"
fi

echo ""
echo "4. Testing File Structure"
echo "-------------------------"

# Check critical files exist
CRITICAL_FILES=(
  "src/App.tsx"
  "src/components/AppLayout.tsx"
  "src/pages/MeditatePage.tsx"
  "src/pages/LeaderboardPage.tsx"
  "src/pages/ProfilePage.tsx"
  "src/pages/FriendsPage.tsx"
  "src/pages/GroupsPage.tsx"
  "src/stores/authStore.ts"
  "src/stores/meditationStore.ts"
  "src/services/api.ts"
  "netlify/functions/auth-login.js"
  "netlify/functions/auth-register.js"
  "netlify/functions/leaderboards-global.js"
  "netlify/functions/sessions-complete.js"
  "netlify/functions/lib/neon-db.js"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
  fi
done

echo ""
echo "5. Testing Database Functions"
echo "----------------------------"

# Test database connectivity through API
echo "Testing database connectivity..."
if [[ ! -z "$TOKEN" ]]; then
  USER_PROFILE=$(curl -s -X GET "$API_BASE/users-profile" \
    -H "Authorization: Bearer $TOKEN" || echo "ERROR")
  
  if [[ $USER_PROFILE == *"displayName"* ]]; then
    echo "✅ Database connectivity working"
  else
    echo "❌ Database connectivity failed"
  fi
else
  echo "⚠️  Cannot test database connectivity - no valid token"
fi

echo ""
echo "6. Summary"
echo "----------"
echo "Production URL: https://chrysalis-presence-app.netlify.app"
echo "Development URL: http://localhost:3001"
echo ""
echo "Manual testing checklist:"
echo "• Registration and login flow"
echo "• Profile picture upload and display"
echo "• Meditation session completion"
echo "• Leaderboard updates"
echo "• Friends system functionality"
echo "• Groups page (no crashes)"
echo "• Mobile responsiveness"
echo "• Cross-device sync"
echo ""
echo "QA Test Complete! 🎉"
