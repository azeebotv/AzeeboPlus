# Skill: Debug Service

> Debug a running service by checking logs, health, and state.

---

## Usage

```
/debug-service [service] [issue]

Examples:
/debug-service reality-service "votes not saving"
/debug-service wallet-service "balance not updating"
/debug-service api-gateway "502 errors"
```

## What It Does

1. Checks service health status
2. Reads recent logs
3. Checks database connections
4. Verifies environment variables
5. Tests API endpoints
6. Identifies root cause

## Debugging Commands

```bash
# Check if service is running
./scripts/local-dev.sh status

# Tail service logs
./scripts/local-dev.sh logs [service]

# Check health endpoint
curl http://localhost:[PORT]/health

# Check database connection
cd services/[category]/[service-name]
npx prisma studio

# Check Redis connection
redis-cli ping

# Test API endpoint
curl -X POST http://localhost:[PORT]/[endpoint] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{}'
```

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 500 errors | Database connection | Check DATABASE_URL |
| 401 errors | JWT expired/invalid | Check token, refresh |
| 429 errors | Rate limited | Wait or increase limit |
| Timeout | Service down | Check service status |
| 502 errors | Gateway routing | Check route config |

## Rules

- Always check logs first
- Test with minimal reproduction case
- Check environment variables
- Verify database state
- Don't modify production without approval
