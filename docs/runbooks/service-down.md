# Runbook: Service Down
## Alert: health_check_failed | Severity: Critical
## Impact: Complete service outage
## Investigation
1. Check pod status: `kubectl get pods -n azeebo -l app=<service>`
2. Check pod logs: `kubectl logs -n azeebo <pod-name> --tail=200`
3. Check resource usage: `kubectl top pods -n azeebo`
4. Check recent events: `kubectl get events -n azeebo --sort-by=.lastTimestamp`
## Resolution
1. Pod crashloop → check logs, restart
2. OOMKilled → increase memory limits
3. Node issue → cordon node, reschedule
## Escalation: Immediate page to on-call
