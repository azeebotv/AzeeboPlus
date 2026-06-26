#!/bin/bash
# Test script for all endpoints

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhemVlYm8tYXV0aCIsImF1ZCI6ImF6ZWViby1hcGkiLCJqdGkiOiIzNTY4YjM3NC0xZDVkLTQ1OTMtYjY3Zi1iNzNkOThlZmNkZmMiLCJzdWIiOiIzOTJiZDRkMy1hYjIzLTQ2YWItYWJiMi04NTExMDM5MDI2M2IiLCJlbWFpbCI6ImFkbWluQGF6ZWViby5jb20iLCJyb2xlIjoidXNlciIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3ODI0OTc3NzEsImV4cCI6MTc4MjQ5ODY3MX0._VoUmJt69o4u6MKfaNc6LLiCBKnWT2voiUMfUidtb_I"

echo "=== Testing Endpoints ==="

echo -n "1. Login via Gateway: "
curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3013/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@azeebo.com","password":"Admin123!"}'

echo -n " | 2. Wallet: "
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3013/api/v1/wallet" \
  -H "Authorization: Bearer $TOKEN"

echo -n " | 3. User History: "
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3013/api/v1/users/me/history?limit=5" \
  -H "Authorization: Bearer $TOKEN"

echo -n " | 4. Continue Watching: "
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3013/api/v1/users/me/continue-watching?limit=5" \
  -H "Authorization: Bearer $TOKEN"

echo -n " | 5. Recommendation: "
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3013/api/v1/recommendation/personalized" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo ""
echo "=== Wallet Detail ==="
curl -s "http://localhost:3013/api/v1/wallet" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -15
