# Runbook: High Error Rate
## Alert: error_rate > 5% for 5 minutes | Severity: Critical
## Impact: Users experiencing errors, potential revenue loss
## Investigation
1. Check service health: `curl https://api.azeeboplus.com/health`
2. Check recent deployments: `kubectl get deployments -n azeebo`
3. Check error logs: `kubectl logs -n azeebo -l app=<service> --tail=100`
4. Check database: `psql -c "SELECT 1"`
## Resolution
1. Recent deployment → rollback
2. Database issue → check connection pool
3. External dependency → check circuit breaker
## Escalation: 15min → on-call, 30min → engineering lead
