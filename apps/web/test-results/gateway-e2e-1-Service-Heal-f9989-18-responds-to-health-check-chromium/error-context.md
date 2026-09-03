# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gateway-e2e.spec.ts >> 1. Service Health — All 29 Services >> creator-service (port 3018) responds to health check
- Location: e2e/api/gateway-e2e.spec.ts:123:9

# Error details

```
Error: apiRequestContext.fetch: connect ECONNREFUSED ::1:3018
Call log:
  - → GET http://localhost:3018/v1/health
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```