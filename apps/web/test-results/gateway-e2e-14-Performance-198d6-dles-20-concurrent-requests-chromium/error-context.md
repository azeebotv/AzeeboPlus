# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gateway-e2e.spec.ts >> 14. Performance >> gateway handles 20 concurrent requests
- Location: e2e/api/gateway-e2e.spec.ts:783:7

# Error details

```
Error: apiRequestContext.fetch: connect ECONNREFUSED ::1:3013
Call log:
  - → GET http://localhost:3013/health
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json

```