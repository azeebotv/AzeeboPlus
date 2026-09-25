# Runbook: Database Connection Pool Exhausted
## Alert: db_pool_usage > 90% | Severity: Critical
## Investigation
1. Check active connections: `SELECT count(*) FROM pg_stat_activity`
2. Check slow queries: `SELECT * FROM pg_stat_activity WHERE state = 'active'`
3. Check connection pool: `SHOW pool_status;`
## Resolution
1. Kill idle connections
2. Restart PgBouncer if needed
3. Scale database if persistent
