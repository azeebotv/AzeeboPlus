# Skill: Monitor Service

> Monitor service health, performance, and metrics.

---

## Usage

```
/monitor-service [service] [--metrics]

Examples:
/monitor-service reality-service
/monitor-service wallet-service --metrics
/monitor-service --all --health
```

## What It Does

1. Checks health status of all services
2. Displays running processes
3. Shows resource usage (CPU, memory)
4. Checks database connections
5. Verifies Redis connectivity
6. Shows request metrics

## Monitoring Commands

```bash
# Check all services status
./scripts/local-dev.sh status

# Check specific service health
curl http://localhost:[PORT]/health

# Check database connections
cd services/[category]/[service-name]
npx prisma db push --accept-data-loss 2>&1 | head -5

# Check Redis
redis-cli info memory

# Check Docker containers (if using Docker)
docker ps --filter "name=azeebo"

# Check process list
ps aux | grep "[service-name]"
```

## Health Check Response

```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "redis": "connected",
    "uptime": 3600
  }
}
```

## Metrics to Watch

| Metric | Normal Range | Alert If |
|--------|--------------|----------|
| Response time | < 200ms | > 500ms |
| Error rate | < 1% | > 5% |
| Memory usage | < 80% | > 90% |
| CPU usage | < 70% | > 85% |
| DB connections | < 80% pool | > 90% pool |

## Rules

- Check health before debugging issues
- Monitor during load testing
- Set up alerts for critical metrics
- Log all anomalies
