#!/bin/bash
echo "=== Signup ==="
SIGNUP=$(curl -s -X POST "http://localhost:3013/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"authfix$(date +%s)@azeebo.com\",\"password\":\"AuthFix123!\",\"displayName\":\"Auth Fix Test\"}")
echo "$SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d,indent=2))" 2>/dev/null | head -10

TOKEN=$(echo "$SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('data',{}); print(t.get('accessToken','') or t.get('access_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo ""
  echo "=== Login ==="
  EMAIL=$(echo "$SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('user',{}).get('email',''))" 2>/dev/null)
  LOGIN=$(curl -s -X POST "http://localhost:3013/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"AuthFix123!\"}")
  echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d,indent=2))" 2>/dev/null | head -10
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('data',{}); print(t.get('accessToken','') or t.get('access_token',''))" 2>/dev/null)
fi

if [ -n "$TOKEN" ]; then
  echo ""
  echo "=== Wallet ==="
  curl -s "http://localhost:3013/api/v1/wallet" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -10
  echo ""
  echo "=== History ==="
  curl -s -o /dev/null -w "HTTP %{http_code}" "http://localhost:3013/api/v1/users/me/history?limit=5" -H "Authorization: Bearer $TOKEN"
  echo ""
  echo "=== Continue Watching ==="
  curl -s -o /dev/null -w "HTTP %{http_code}" "http://localhost:3013/api/v1/users/me/continue-watching?limit=5" -H "Authorization: Bearer $TOKEN"
  echo ""
else
  echo "ERROR: No token"
fi
