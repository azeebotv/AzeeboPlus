# Phase 3 — Reliability Engineering Review — Findings (P3-031..P3-035)

> **Owner:** SRE + Platform
> **Captured at:** 2026-06-22 · SHA `fc01c8c`
> **Evidence on disk:**
> • [audit-evidence/P3/reliability/_scan.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/reliability/_scan.txt)
> • [audit-evidence/P3/findings/P3-NNN-reliability-findings.md](file:///Users/deprof/www/azeebo+/audit-evidence/P3/findings/P3-NNN-reliability-findings.md) (this file)

---

## P3-031 — 🟠 P1 High — Idempotency keys not enforced on mutating routes

**Symptom.** No first-party idempotency middleware found in the contract index. Wallet top-up, payment charge, reward redemption all accept POST without an `Idempotency-Key` header. A network retry can double-charge.

**Root-cause framing.**
```
FABLE 5 pillars violated:  B (Brevity) — duplicate charges on retry
                            F (Foundational Security) — financial integrity
```

**Resolution steps.**
1. Add a NestJS guard that enforces `Idempotency-Key` on every `@Post` route under `services/core/wallet-service`, `payment-service`, `reward-service`.
2. Persist keys in Redis with a 24h TTL.

**Snippet.**
```typescript
// services/core/wallet-service/src/common/idempotency.guard.ts
@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(private redis: RedisService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    if (req.method !== 'POST') return true;
    const key = req.headers['idempotency-key'];
    if (!key) throw new BadRequestException('Idempotency-Key required');
    const set = await this.redis.set(`idem:${key}`, '1', 'EX', 86400, 'NX');
    if (set === null) throw new ConflictException('Duplicate request');
    return true;
  }
}
```

**Verification checklist.**
- [ ] POST without `Idempotency-Key` → 400.
- [ ] POST twice with the same key → 200 + 409 (cached body returned).
- [ ] Wallet top-up retry test does not double-credit.

---

## P3-032 — 🟠 P1 High — No retry-with-jitter / timeout budgets

**Symptom.** Service code uses NestJS `HttpService` defaults: no timeout, no retry, no exponential-backoff jitter. Outbound calls to `payment-service`, `notification-service`, external APIs (Paystack, Flutterwave) are unbounded.

**Root-cause framing.**
```
FABLE 5 pillars violated:  L (Latency) — cascading slowness on dependency stall
                            B (Brevity) — request pile-up during incident
```

**Resolution steps.**
1. Wrap outbound calls in a `withRetry({ maxAttempts: 3, baseDelay: 100, jitter: 0.3 })` utility.
2. Apply `timeout: 3000` per call.
3. Add a circuit breaker (already partially in `packages/shared-types/src/circuit-breaker.ts`).

**Snippet.**
```typescript
// packages/reliability/src/retry.ts
export async function withRetry<T>(fn: () => Promise<T>, opts = { maxAttempts: 3, baseDelay: 100, jitter: 0.3, timeoutMs: 3000 }): Promise<T> {
  for (let i = 0; i < opts.maxAttempts; i++) {
    try {
      return await Promise.race([fn(), timeoutAfter(opts.timeoutMs)]);
    } catch (e) {
      if (i === opts.maxAttempts - 1) throw e;
      await delay(opts.baseDelay * 2 ** i + Math.random() * opts.baseDelay * opts.jitter);
    }
  }
}
```

**Verification checklist.**
- [ ] Synthetic 503 from upstream triggers 2 retries before failing.
- [ ] p99 outbound latency stays under 1 s during dependency stall.

---

## P3-033 — 🟡 P2 Medium — Last backup-drill date not recorded

**Symptom.** `scripts/restore-pitr.sh`, `scripts/encrypted-db-backup.sh`, `infra/k8s/base/backup-cronjob.yaml`, `infra/k8s/cronjobs/redis-backup.yaml` all exist, but no `last_drill_passed` record is committed anywhere.

**Root-cause framing.**
```
FABLE 5 pillars violated:  B (Brevity) — RTO/RPO not validated
                            E (Engineering Quality) — no evidence of recoverability
```

**Resolution steps.**
1. Create `infra/runbooks/backup-drill.md` with the drill script.
2. Add a CI job that runs the drill monthly and posts a status to the audit-evidence dir.

**Snippet.**
```yaml
# .github/workflows/backup-drill.yml
name: Monthly Backup Drill
on:
  schedule: [{ cron: '0 4 1 * *' }]
jobs:
  drill:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run drill
        run: bash scripts/restore-pitr.sh --target=staging
      - name: Record result
        run: echo "$(date -Iseconds) DRILL_PASSED" >> audit-evidence/backup-drill.log
```

**Verification checklist.**
- [ ] First drill on the next 1st of month.
- [ ] `audit-evidence/backup-drill.log` shows a row.

---

## P3-034 — 🟡 P2 Medium — `data-retention-enforcement.ts` not invoked

**Symptom.** `scripts/data-retention-enforcement.ts` exists but is not called by any workflow. GDPR/data-retention obligations may be unmet silently.

**Root-cause framing.**
```
FABLE 5 pillars violated:  A (Architecture) — compliance script orphaned
                            F (Foundational Security) — data retention unproven
```

**Resolution steps.**
1. Add a weekly workflow: `data-retention.yml`.
2. Have it call the script and report counts.

**Snippet.**
```yaml
# .github/workflows/data-retention.yml
name: Data Retention
on: { schedule: [{ cron: '0 5 * * 0' }] }
jobs:
  enforce:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm ts-node scripts/data-retention-enforcement.ts --dry-run
```

**Verification checklist.**
- [ ] Weekly dry-run output captured in `audit-evidence/data-retention.log`.

---

## P3-035 — 🟢 P3 Low — Blue-green deploy script invoked but timeout inconsistent

**Symptom.** `cd.yml` invokes `scripts/blue-green-deploy.sh azeebo <svc> <image> 300` with timeout 300 s. The configmap says `SWITCH_TIMEOUT: 300` for prod, `180` for staging. The CLI argument overrides the configmap.

**Root-cause framing.**
```
FABLE 5 pillars violated:  E (Engineering Quality) — configmap vs CLI inconsistency
                            B (Brevity)             — operator confusion
```

**Resolution steps.**
1. Remove the CLI timeout argument; let the script read from the configmap via downward API.
2. Surface a `--timeout` override only via `workflow_dispatch` input.

**Snippet.**
```bash
# scripts/blue-green-deploy.sh
TIMEOUT=${BLUE_GREEN_TIMEOUT:-300}
```

```yaml
# cd.yml
env:
  BLUE_GREEN_TIMEOUT: "300"
```

**Verification checklist.**
- [ ] Production deploy uses configmap-driven timeout.
- [ ] `--timeout` CLI flag is documented and reserved for emergencies.