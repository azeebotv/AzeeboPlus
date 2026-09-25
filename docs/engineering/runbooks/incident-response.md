# Incident Response Runbook

## Severity Levels
| Level | Description | Response Time |
|-------|------------|---------------|
| P0 | Payment failure, data loss, security breach | Immediate |
| P1 | Core feature broken, no workaround | 1 hour |
| P2 | Feature degraded, workaround exists | 4 hours |
| P3 | Minor issue, cosmetic | Next business day |

## Common Incidents

### Payment Failure
1. Check payment-service logs
2. Verify Paystack/Flutterwave API status
3. Check webhook processing
4. Verify wallet balance consistency
5. Escalate if systemic

### Authentication Failure
1. Check auth-service health
2. Verify JWT secrets are valid
3. Check database connectivity
4. Verify rate limiting not blocking legitimate requests

### Service Down
1. Check service health endpoint
2. Check Docker/container status
3. Review service logs
4. Check database connectivity
5. Restart service if needed

### Database Issues
1. Check PostgreSQL connection
2. Review slow query logs
3. Check connection pool usage
4. Verify disk space

## Rollback Procedure
```bash
# Stop current container
docker stop azeebo-all-in-one

# Start previous version
docker run -d --name azeebo-all-in-one \
  -p 3013:3013 -p 4000:4000 -p 4014:4014 -p 4016:4016 \
  --env-file .env \
  ghcr.io/azeebotv/azeebo-all-in-one:previous-tag
```

## Contact
- DevOps: #devops Slack channel
- Engineering: #engineering Slack channel
- On-call: Rotate weekly
