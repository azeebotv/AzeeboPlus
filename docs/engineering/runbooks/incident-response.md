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

One container runs the whole platform, so a rollback is an image-tag change:

```bash
# Automated: Actions -> Rollback Deployment (verifies the tag in GHCR first)
gh workflow run rollback.yml -f environment=production -f target_tag=<tag>

# On the deploy host: pulls the tag before touching the live container and
# restores the previous image if the health check fails
ENVIRONMENT=production ./scripts/rollback.sh <tag> --dry-run   # preview
ENVIRONMENT=production ./scripts/rollback.sh <tag>
```

The workflow run's summary records a **Rollback verification** block: the tag
that was restored, the commit `/version` reports, and whether Coolify's
`IMAGE_TAG` now names that tag. Cite it in the incident timeline instead of
re-deriving which build is live.

Data is not rolled back by either path — if the reverted release applied
migrations, confirm schema compatibility separately.

## Contact
- DevOps: #devops Slack channel
- Engineering: #engineering Slack channel
- On-call: Rotate weekly
