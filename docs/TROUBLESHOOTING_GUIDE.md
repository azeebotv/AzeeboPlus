# Troubleshooting Guide

**Last Updated:** June 2, 2026  
**Version:** 1.0  
**Audience:** Developers, DevOps, Support Team  

---

## 1. Quick Reference

### 1.1 Common Error Codes

| Error Code | Meaning | Likely Cause | Solution |
|------------|---------|--------------|----------|
| `AUTH_001` | Invalid token | Expired JWT | Refresh token or re-login |
| `AUTH_002` | Token revoked | User logged out | Re-authenticate |
| `AUTH_003` | Insufficient permissions | RBAC denial | Check user role |
| `WALLET_001` | Insufficient balance | Low wallet balance | Fund wallet |
| `WALLET_002` | Transaction failed | Payment provider error | Retry or contact support |
| `PAYMENT_001` | Payment declined | Card/bank issue | Use different payment method |
| `CONTENT_001` | Content not found | Invalid ID or deleted | Verify content ID |
| `RATE_LIMIT` | Rate limit exceeded | Too many requests | Wait and retry |

### 1.2 Health Check URLs

| Service | Health URL |
|---------|-----------|
| Auth | `/auth/health` |
| Content | `/content/health` |
| Wallet | `/wallet/health` |
| Payment | `/payment/health` |
| Engagement | `/engagement/health` |
| Lifestyle | `/lifestyle/health` |
| Referral | `/referrals/health` |
| Messaging | `/messaging/health` |

---

## 2. Authentication Issues

### 2.1 User Cannot Login

**Symptoms:**
- Login fails with "Invalid credentials"
- User reports correct password

**Diagnostic Steps:**

```bash
# Check user exists in database
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT id, email, isActive, isVerified FROM users WHERE email = 'user@example.com';"

# Check if account is locked
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT failedLoginAttempts, lockedUntil FROM users WHERE email = 'user@example.com';"
```

**Possible Causes:**
- Account not verified
- Account locked due to failed attempts
- Password incorrect
- MFA required but not provided

**Solutions:**
- Ask user to verify email
- Reset failed login attempts: `UPDATE users SET failedLoginAttempts = 0 WHERE email = 'user@example.com';`
- Reset password via forgot password flow
- Provide MFA setup instructions

---

### 2.2 Token Expired/Invalid

**Symptoms:**
- API returns 401 Unauthorized
- "Token expired" error message

**Diagnostic Steps:**

```bash
# Decode JWT to check expiration
echo "<token>" | cut -d'.' -f2 | base64 -d | jq

# Check token in database
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT expiresAt, revokedAt FROM sessions WHERE token = '<token>';"
```

**Possible Causes:**
- Access token expired (15-30 min TTL)
- Refresh token expired (7 day TTL)
- Token revoked (user logged out)
- Token from different environment

**Solutions:**
- Use refresh token to get new access token
- Re-authenticate if refresh token expired
- Check environment mismatch (staging vs production tokens)

---

### 2.3 MFA Issues

**Symptoms:**
- MFA code rejected
- User lost MFA device

**Diagnostic Steps:**

```bash
# Check MFA status
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT mfaEnabled, mfaSecret IS NOT NULL as has_secret FROM users WHERE id = 'user-id';"
```

**Solutions:**
- Verify time synchronization on MFA device
- Disable MFA for user (admin action): `UPDATE users SET mfaEnabled = false WHERE id = 'user-id';`
- Provide backup codes if available

---

## 3. Payment Issues

### 3.1 Payment Failed

**Symptoms:**
- Payment returns error
- User charged but order not completed

**Diagnostic Steps:**

```bash
# Check payment status
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT id, status, amount, provider, providerRef FROM payments WHERE userId = 'user-id' ORDER BY createdAt DESC LIMIT 5;"

# Check webhook logs
kubectl logs deployment/payment-service -n production --tail=100 | grep webhook

# Check payment provider status
curl -X GET https://api.paystack.co/transaction/verify/<reference> \
  -H "Authorization: Bearer $PAYSTACK_SECRET_KEY"
```

**Possible Causes:**
- Insufficient funds
- Card declined
- Payment provider downtime
- Webhook not received
- Idempotency key conflict

**Solutions:**
- Ask user to try different payment method
- Retry payment if provider error
- Manually process webhook if missed
- Clear idempotency key if duplicate

---

### 3.2 Wallet Balance Incorrect

**Symptoms:**
- Balance doesn't match expected value
- Transaction missing from history

**Diagnostic Steps:**

```bash
# Check wallet balance
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT id, balance, bonusBalance, promoBalance FROM wallets WHERE userId = 'user-id';"

# Check transaction history
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT id, type, amount, status, description FROM transactions WHERE walletId = 'wallet-id' ORDER BY createdAt DESC LIMIT 20;"

# Recalculate balance from transactions
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) as calculated_balance FROM transactions WHERE walletId = 'wallet-id' AND status = 'completed';"
```

**Possible Causes:**
- Transaction failed but not reflected
- Race condition in concurrent transactions
- Missing webhook processing

**Solutions:**
- Recalculate balance from transactions
- Process missing webhooks
- Fix balance manually (with audit trail)

---

## 4. Content Issues

### 4.1 Content Not Loading

**Symptoms:**
- Content page shows error
- Media not playing

**Diagnostic Steps:**

```bash
# Check content exists
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT id, title, status, type FROM content_items WHERE id = 'content-id';"

# Check media asset
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT id, originalUrl, status FROM media_assets WHERE contentId = 'content-id';"

# Check service logs
kubectl logs deployment/content-service -n production --tail=50
```

**Possible Causes:**
- Content not published
- Media asset missing
- Signed URL expired
- CDN cache issue

**Solutions:**
- Publish content if draft
- Re-upload media if missing
- Generate new signed URL
- Invalidate CDN cache

---

### 4.2 Upload Failed

**Symptoms:**
- File upload returns error
- Upload stuck at progress

**Diagnostic Steps:**

```bash
# Check file size limits
# Image: 50MB, Video: 500MB, Audio: 100MB, Document: 50MB

# Check allowed file types
# Image: jpg, png, webp
# Video: mp4, webm
# Audio: mp3, aac
# Document: pdf

# Check storage service logs
kubectl logs deployment/content-service -n production --tail=50 | grep upload
```

**Possible Causes:**
- File too large
- Invalid file type
- Storage service unavailable
- Network timeout

**Solutions:**
- Compress file or reduce size
- Convert to supported format
- Retry upload
- Check network connection

---

## 5. Performance Issues

### 5.1 Slow API Response

**Symptoms:**
- API takes >2 seconds to respond
- Timeout errors

**Diagnostic Steps:**

```bash
# Check service metrics in Grafana
# Grafana → Service Dashboard → Response Time

# Check database query performance
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo \
  -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check cache hit rate
kubectl exec -it <redis-pod> -- redis-cli INFO stats | grep keyspace_hits
```

**Possible Causes:**
- Missing database index
- N+1 query problem
- Cache miss
- Resource contention

**Solutions:**
- Add missing index
- Optimize query with Prisma select
- Warm up cache
- Scale service horizontally

---

### 5.2 High Memory Usage

**Symptoms:**
- Service restarting due to OOM
- Memory usage >80%

**Diagnostic Steps:**

```bash
# Check pod memory usage
kubectl top pod -n production

# Check Node.js heap
kubectl exec -it <service-pod> -- node --inspect

# Check for memory leaks
# Enable heap snapshots in development
```

**Possible Causes:**
- Memory leak in service
- Large response payloads
- Connection pool not released
- Cache growing unbounded

**Solutions:**
- Fix memory leak (profile with heap snapshots)
- Paginate large responses
- Release database connections properly
- Set cache TTL and max size

---

## 6. Infrastructure Issues

### 6.1 Service Not Starting

**Symptoms:**
- Pod in CrashLoopBackOff
- Service unavailable

**Diagnostic Steps:**

```bash
# Check pod status
kubectl get pods -n production

# Check pod events
kubectl describe pod <pod-name> -n production

# Check logs
kubectl logs <pod-name> -n production --previous

# Check resource limits
kubectl top pod <pod-name> -n production
```

**Possible Causes:**
- Missing environment variable
- Database connection failed
- Port conflict
- Invalid configuration

**Solutions:**
- Add missing environment variable
- Check database connectivity
- Change port configuration
- Fix configuration values

---

### 6.2 Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Connection pool exhausted

**Diagnostic Steps:**

```bash
# Check database status
kubectl get pods -n production | grep postgres

# Check connection pool
kubectl exec -it <postgres-pod> -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check PgBouncer status
kubectl exec -it <pgbouncer-pod> -- psql -U pgbouncer -p 6432 -c "SHOW POOLS;"

# Test connectivity
kubectl exec -it <service-pod> -- nc -zv postgres 5432
```

**Possible Causes:**
- Database pod down
- Connection pool exhausted
- Network policy blocking
- Credentials expired

**Solutions:**
- Restart database pod
- Increase pool size
- Update network policies
- Rotate credentials

---

### 6.3 Redis Issues

**Symptoms:**
- Cache misses
- Session loss
- Rate limiting not working

**Diagnostic Steps:**

```bash
# Check Redis status
kubectl get pods -n production | grep redis

# Check Redis memory
kubectl exec -it <redis-pod> -- redis-cli INFO memory

# Check Redis connectivity
kubectl exec -it <service-pod> -- redis-cli -h redis ping

# Check Redis logs
kubectl logs <redis-pod> -n production
```

**Possible Causes:**
- Redis pod down
- Memory limit reached
- Network issue
- Configuration error

**Solutions:**
- Restart Redis pod
- Increase memory limit
- Check network policies
- Verify configuration

---

## 7. Mobile App Issues

### 7.1 App Crashes on Launch

**Symptoms:**
- App closes immediately after opening
- White screen then crash

**Diagnostic Steps:**

```bash
# Check Expo logs
npx expo start --clear

# Check device logs (iOS)
xcrun simctl logverbose booted

# Check device logs (Android)
adb logcat | grep -i expo
```

**Possible Causes:**
- Missing environment variable
- API URL misconfigured
- Incompatible Expo version
- Corrupted cache

**Solutions:**
- Verify `.env` configuration
- Clear app cache
- Update Expo SDK
- Rebuild app

---

### 7.2 API Calls Failing on Mobile

**Symptoms:**
- Network error in app
- Data not loading

**Diagnostic Steps:**

```bash
# Check API URL configuration
# Should be https://api.azeebo.com for production

# Check CORS configuration
curl -I https://api.azeebo.com/auth/health

# Check SSL certificate
openssl s_client -connect api.azeebo.com:443
```

**Possible Causes:**
- Wrong API URL
- CORS blocking
- SSL certificate expired
- Network connectivity

**Solutions:**
- Update API URL in environment
- Fix CORS configuration
- Renew SSL certificate
- Check device network

---

## 8. Web App Issues

### 8.1 Page Not Loading

**Symptoms:**
- Blank page
- Loading spinner forever

**Diagnostic Steps:**

```bash
# Check browser console for errors
# Open DevTools → Console

# Check network requests
# Open DevTools → Network

# Check Next.js logs
pnpm --filter web dev
```

**Possible Causes:**
- JavaScript error
- API endpoint down
- Missing environment variable
- Build error

**Solutions:**
- Fix JavaScript error
- Restart API service
- Add missing environment variable
- Rebuild application

---

### 8.2 Authentication Not Working on Web

**Symptoms:**
- Login succeeds but user not authenticated
- Token not persisted

**Diagnostic Steps:**

```bash
# Check localStorage for token
# Open DevTools → Application → Local Storage

# Check AuthContext state
# Add console.log in AuthContext.tsx

# Check API response
# Network tab → login request → Response
```

**Possible Causes:**
- Token not saved to localStorage
- AuthContext not updating
- CORS blocking cookie
- Token format incorrect

**Solutions:**
- Fix token storage logic
- Update AuthContext state properly
- Configure CORS for cookies
- Verify token format

---

## 9. Escalation Procedures

### 9.1 When to Escalate

| Issue Type | Wait Time | Escalate To |
|------------|-----------|-------------|
| Service outage | 15 minutes | DevOps Team |
| Payment failure | 30 minutes | Payments Team |
| Security incident | Immediately | Security Team |
| Data loss | Immediately | CTO + Security |
| Performance degradation | 1 hour | Engineering Lead |

### 9.2 Escalation Contacts

| Role | Contact | Channel |
|------|---------|---------|
| On-call Engineer | PagerDuty | #on-call |
| DevOps Lead | @devops-lead | #devops |
| Engineering Lead | @eng-lead | #engineering |
| Security Team | @security-team | #security |
| CTO | @cto | Direct message |

---

## 10. Post-Incident Review

### 10.1 Incident Report Template

```markdown
# Incident Report

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** P1/P2/P3/P4
**Services Affected:** [list]

## Summary
Brief description of what happened

## Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Issue resolved

## Root Cause
Detailed explanation of what caused the issue

## Impact
- Users affected: X
- Revenue impact: $X
- Data loss: Yes/No

## Resolution
Steps taken to fix the issue

## Preventive Measures
- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3

## Lessons Learned
What went well, what could be improved
```

---

## 11. Useful Commands Reference

### 11.1 Kubernetes

```bash
# List all pods
kubectl get pods -n production

# Describe pod
kubectl describe pod <pod-name> -n production

# View logs
kubectl logs -f <pod-name> -n production

# Exec into pod
kubectl exec -it <pod-name> -n production -- sh

# Restart deployment
kubectl rollout restart deployment/<service-name> -n production

# Rollback deployment
kubectl rollout undo deployment/<service-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
```

### 11.2 Database

```bash
# Connect to database
kubectl exec -it <postgres-pod> -- psql -U postgres -d azeebo

# List tables
\dt

# Describe table
\d table_name

# Explain query
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

# Check slow queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### 11.3 Redis

```bash
# Connect to Redis
kubectl exec -it <redis-pod> -- redis-cli

# Check memory
INFO memory

# List keys
KEYS *

# Get key value
GET key_name

# Delete key
DEL key_name

# Check stats
INFO stats
```

---

**Document Owner:** Engineering Team  
**Review Frequency:** Quarterly  
**Next Review:** September 2, 2026
