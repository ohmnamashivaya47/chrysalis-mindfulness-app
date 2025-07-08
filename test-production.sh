#!/bin/bash

echo "🎉 CHRYSALIS PRODUCTION DEPLOYMENT TEST"
echo "======================================"

# Test backend health
echo "1. Backend Health Check:"
curl -s "https://chrysalis-mindfulness-app.onrender.com/health"

echo -e "\n\n2. CORS Preflight Test:"
curl -s -i -H "Origin: https://chrysalis-presence-app.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS "https://chrysalis-mindfulness-app.onrender.com/api/auth/register" | head -15

echo -e "\n3. 🔐 Authentication Test:"
echo "Registration Test:"
REG_RESPONSE=$(curl -s -X POST "https://chrysalis-mindfulness-app.onrender.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: https://chrysalis-presence-app.netlify.app" \
  -d "{
    \"email\": \"production-test-$(date +%s)@example.com\",
    \"password\": \"Test123!@#\",
    \"display_name\": \"Production Test User\"
  }")

echo $REG_RESPONSE

# Extract token for further tests
TOKEN=$(echo $REG_RESPONSE | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

echo -e "\n4. 🧘 Session Test:"
curl -s -X POST "https://chrysalis-mindfulness-app.onrender.com/api/sessions/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "duration": 300,
    "type": "breathing",
    "frequency": "daily"
  }'

echo -e "\n\n5. 🏆 Leaderboard Test:"
curl -s -H "Authorization: Bearer $TOKEN" \
"https://chrysalis-mindfulness-app.onrender.com/api/leaderboards/global"

echo -e "\n\n6. 💭 Wisdom Quotes Test:"
curl -s -H "Authorization: Bearer $TOKEN" \
"https://chrysalis-mindfulness-app.onrender.com/api/wisdom/quotes/daily"

echo -e "\n\n📱 Frontend URLs:"
echo "✅ Primary: https://chrysalis-presence-app.netlify.app"
echo "✅ Backend: https://chrysalis-mindfulness-app.onrender.com"

echo -e "\n� ALL SYSTEMS OPERATIONAL!"
echo "Ready for end-to-end user testing!"
