#!/bin/bash
set -euo pipefail

echo "=== Signup ==="
SIGNUP=$(curl -s -X POST "http://localhost:3013/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testfix$(date +%s)@azeebo.com\",\"password\":\"TestFix123!\",\"displayName\":\"Fix Test\"}")
echo "$SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d,indent=2))" 2>/dev/null | head -10

TOKEN=$(echo "$SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('data',{}); print(t.get('accessToken','') or t.get('access_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Signup returned no token, trying login..."
  LOGIN=$(curl -s -X POST "http://localhost:3013/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"testfix@azeebo.com","password":"TestFix123!"}')
  echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d,indent=2))" 2>/dev/null | head -10
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('data',{}); print(t.get('accessToken','') or t.get('access_token',''))" 2>/dev/null)
fi

if [ -n "$TOKEN" ]; then
  echo ""
  echo "=== Wallet ==="
  curl -s "http://localhost:3013/api/v1/wallet" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -12
  echo ""
  echo "=== History ==="
  curl -s -o /dev/null -w "HTTP %{http_code}" "http://localhost:3013/api/v1/users/me/history?limit=5" -H "Authorization: Bearer $TOKEN"
  echo ""
  echo "=== Continue Watching ==="
  curl -s -o /dev/null -w "HTTP %{http_code}" "http://localhost:3013/api/v1/users/me/continue-watching?limit=5" -H "Authorization: Bearer $TOKEN"
  echo ""
  echo "=== Recommendation ==="
  curl -s -o /dev/null -w "HTTP %{http_code}" "http://localhost:3013/api/v1/recommendation/personalized" -H "Authorization: Bearer $TOKEN"
  echo ""
else
  echo "ERROR: No token available"
fi
