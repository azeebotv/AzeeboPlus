# Feature Flag Rollout Policy

How Azeebo+ ships behavior behind flags: a staged rollout with explicit
monitoring gates and kill-switch discipline.

## Staging ladder

Every non-trivial flag follows the same progression. Each step is a stored flag
state change in the admin Global Flags page, not a deployment.

| Stage | Rollout % | User targeting | Gate to advance |
| --- | --- | --- | --- |
| 0 — Dark launch | 0% | internal test accounts | Code merged, flag off, kill-switch in place |
| 1 — Dogfood | 10% | + opt-in user IDs | No critical errors for 24–48h (alerts: 500s, Redis, queues) |
| 2 — Controlled | 50% | — | Error rate ≤ baseline; no support-ticket spike |
| 3 — Full | 100% | — | 7d at 50% clean; observability dashboards flat |
| 4 — Remove | — | — | 2 sprints at 100%; delete flag, sweep `isEnabled` calls |

## Monitoring gates

A rollout **must not** advance while any of these are red:

- Service error rate above the team's baseline (alert on 5xx rate).
- `search_fuzzy_degraded`, queue DLQ growth, or payment provider failures
  climbing for the flag's service.
- Redis flag-store latency or evaluation errors (flags fail closed where the
  service treats a store outage as "safe default", not as "on").

## Kill-switch discipline

- Every flag that gates a dangerous or costly surface (payments, emails, CDN
  purges, AI inference, dead-letter retries) is an **on-by-default guard** that
  ops can flip off from the admin page in one click — no deploy.
- Service-level gates (not just route guards) protect the same feature so a
  403 at the edge and a logic branch at the core agree.
- Flipping a flag off must be **observable**: audit-logged (`feature_flag.updated`,
  actor + old→new) and, where relevant, surfaced on `/health` or admin stats
  (e.g. search fuzzy status).

## Naming + defaults conventions

- `{service}_{feature}` snake_case keys, e.g. `queue_dlq_retry_max_passes`.
- Booleans default **off** for anything risky/experimental; **on** for things
  that already exist and are being made reversible.
- Numeric tuning knobs (`analytics_sampling_rate`, `queue_concurrency_payments`)
  live in `defaultValues` and are clamped to sane ranges at read time.
- Every key is registered in `packages/feature-flags/src/registries.ts` with its
  owning service, default, and description — the admin "known flags" reference
  and the docs derive from it.
- Rollouts use `rolloutPercentage` (0–100 hash-bucket) + optional `userIds`
  (targeted users always win); targeted users are served first, the remainder
  bucketed within the rollout %.

## Cleanup

- Set `staleAfter` when the flag reaches 100% so the admin **stale flags**
  report (`GET /api/v1/admin/feature-flags/stale`) lists it for removal.
- Remove the flag 2 sprints after full rollout; never hard-delete audit history
  — archive removed flags in the audit log.
- After removal, sweep for leftover `isEnabled`/`isEnabled` calls.
