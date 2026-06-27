#!/bin/bash
for path in "/recommendation/personalized" "/v1/recommendation/personalized" "/v/recommendation/personalized" "/recommendation/content" "/v1/recommendation/content"; do
  code=$(curl -s -w "\n%{http_code}" "http://localhost:3009$path" 2>/dev/null | tail -1)
  echo "$code $path"
done
