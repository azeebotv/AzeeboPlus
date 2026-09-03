# Azeebo+ Operational Runbook

## Quick Reference

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 3013 | `curl http://localhost:3013/health` |
| Auth Service | 3000 | `curl http://localhost:3000/v1/health` |
| Web App | 4000 | `curl http://localhost:4000` |
| Admin Panel | 4100 | `curl http://localhost:4100` |
| Creator App | 4104 | `curl http://localhost:4104` |

## Incident Response

### Service Down

1. Check service status: `lsof -ti :<port> -sTCP:LISTEN`
2. Check logs: `tail -f /tmp/azeebo-<service>.log`
3. Restart service: `cd services/<category>/<service> && node dist/main.js`
4. Verify health: `curl http://localhost:<port>/v1/health`

### Database Connection Lost

1. Check PostgreSQL: `pg_isready`
2. Check connection pool: `SELECT count(*) FROM pg_stat_activity;`
3. Restart affected service
4. Monitor for connection leaks

### Redis Connection Lost

1. Check Redis: `redis-cli ping`
2. Check memory: `redis-cli info memory`
3. Clear cache if needed: `redis-cli FLUSHDB`
4. Restart affected services

### High Memory Usage

1. Check process memory: `ps aux | grep node`
2. Restart memory-heavy services
3. Check for memory leaks in logs
4. Scale horizontally if needed

### API Gateway Overload

1. Check rate limiting: `curl http://localhost:3013/metrics`
2. Increase rate limits if legitimate traffic
3. Check for DDoS patterns
4. Enable additional caching

## Common Operations

### Start All Services

```bash
./start-all.sh
```

### Stop All Services

```bash
./stop-all.sh
```

### View Logs

```bash
tail -f /tmp/azeebo-*.log
```

### Run Tests

```bash
# Web app
cd apps/web && npx vitest run

# Admin app
cd apps/admin && npm run test

# Creator app
cd apps/creator && npm run test
```

### Database Migration

```bash
cd services/<service>
npx prisma migrate dev
npx prisma generate
```

### Deploy to Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Monitoring

### Key Metrics

- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Active connections
- Memory usage
- CPU usage
- Database connection pool

### Alerts

- Error rate > 5%: Critical
- Latency p99 > 2s: Warning
- Memory > 80%: Warning
- Database connections > 80%: Critical

## Backup & Recovery

### Database Backup

```bash
pg_dump -U azeebo azeebo_auth > backup_$(date +%Y%m%d).sql
```

### Database Restore

```bash
psql -U azeebo azeebo_auth < backup_20260903.sql
```

### Redis Backup

```bash
redis-cli BGSAVE
```

## Security

### Rotate Secrets

1. Update `.env` files
2. Restart all services
3. Verify authentication works
4. Monitor for unauthorized access

### SSL Certificate Renewal

1. Check expiration: `openssl x509 -enddate -noout -in cert.pem`
2. Renew certificate
3. Update nginx/load balancer config
4. Test HTTPS endpoints
