# Queue Service

Azeebo+ Queue Service - BullMQ-based job queue for asynchronous processing.

## Features

- **Email Queue**: Process email sending asynchronously
- **Push Notification Queue**: Process push notifications asynchronously
- **Payment Queue**: Process payment webhooks asynchronously
- **Retry Logic**: Automatic retry with exponential backoff
- **Job Monitoring**: Track job status and progress

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3015 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | redis://localhost:6379 | Redis URL for BullMQ |
| SENDGRID_API_KEY | - | SendGrid API key |
| TWILIO_ACCOUNT_SID | - | Twilio account SID |
| TWILIO_AUTH_TOKEN | - | Twilio auth token |

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm start:dev
```

## Queue Configuration

| Queue | Max Attempts | Backoff Type | Initial Delay |
|-------|--------------|--------------|---------------|
| notifications | 3 | exponential | 5000ms |
| payments | 5 | exponential | 10000ms |
| emails | 3 | exponential | 60000ms |
| analytics | 2 | fixed | 30000ms |
| content-processing | 3 | exponential | 15000ms |

## API Routes

Public:

- `GET /v1/health` - Health check endpoint
- `GET /v1/health/ready` - Readiness probe
- `GET /v1/metrics` - Prometheus metrics (including `queue_dlq_retry_scheduled_total{queue, pass, base_delay_ms}`)

Admin (all guarded by `AdminGuard` — admin JWT required; reachable via the API gateway at `/api/v1/queue/*`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/queue/stats` | Queue-wide statistics |
| GET | `/v1/queue/dlq-policy` | **Effective dead-letter retry policy per queue** (which flag won + resolved values) |
| GET | `/v1/queue/:queue/jobs` | List jobs (filter by `type=waiting,active,failed,delayed`, paginated with `start`/`end`) |
| GET | `/v1/queue/:queue/jobs/failed` | List failed jobs |
| GET | `/v1/queue/:queue/jobs/delayed` | List delayed jobs |
| GET | `/v1/queue/:queue/jobs/:jobId` | Get one job |
| POST | `/v1/queue/:queue/jobs/:jobId/retry` | Retry one failed job (keeps `attemptsMade`) |
| POST | `/v1/queue/:queue/jobs/:jobId/retry-now` | Re-queue a **permanently dead-lettered** job with a fresh attempts budget (resets `attemptsMade` + DLQ pass counter) |
| POST | `/v1/queue/:queue/retry-all-failed` | Retry all failed jobs |
| POST | `/v1/queue/:queue/pause` | Pause a queue |
| POST | `/v1/queue/:queue/resume` | Resume a queue |
| POST | `/v1/queue/:queue/clean` | Clean completed/failed jobs (`grace` ms, default 1h) |

Valid queue names: `notifications`, `payments`, `emails`, `analytics`, `content-processing`.

## Dead-Letter Retry (DLQ) Flags

All three processors (`PaymentProcessor`, `NotificationProcessor`, `EmailProcessor`) dead-letter retry logic is driven by feature flags — tune at runtime from the **Global Flags** page (`/feature-flags/global`, context chip **queue-service**); no deploy needed. Changes apply within the flag cache TTL.

**Precedence** (mirrored by `GET /v1/queue/dlq-policy`, which reports which flag won): per-queue flag → shared flag → registered default (email's 60s base delay constant applies when nothing is registered). Per-queue flags are evaluated only when **explicitly stored** — the default-on listing in the admin UI does not change behavior until a per-queue value is written; "Reset to default" (delete) drops back to the shared flag.

| Flag | Type | Default | Queue | Wins when |
|------|------|---------|-------|-----------|
| `queue_dlq_retry` | toggle | on | all | always (shared switch) |
| `queue_dlq_retry_max_passes` | numeric | 3 | all | always (shared budget) |
| `queue_dlq_retry_base_delay_ms` | numeric | 30000 | all | always (shared base) |
| `queue_dlq_retry_payments` | toggle | on (listed) | payments | stored |
| `queue_dlq_retry_max_passes_payments` | numeric | 3 (listed) | payments | stored |
| `queue_dlq_retry_base_delay_ms_payments` | numeric | 30000 (listed) | payments | stored |
| `queue_dlq_retry_notifications` | toggle | on (listed) | notifications | stored |
| `queue_dlq_retry_max_passes_notifications` | numeric | 3 (listed) | notifications | stored |
| `queue_dlq_retry_base_delay_ms_notifications` | numeric | 30000 (listed) | notifications | stored |
| `queue_dlq_retry_emails` | toggle | on (listed) | emails | stored |
| `queue_dlq_retry_max_passes_emails` | numeric | 3 (listed) | emails | stored |
| `queue_dlq_retry_base_delay_ms_emails` | numeric | 30000 (listed) | emails | stored |

Semantics:

- **Toggle** — off leaves dead-lettered jobs in the failed set (retry manually via the admin endpoints); on re-queues them with a real delay, up to the max-passes budget. A per-queue toggle **off** pauses DLQ retry for that queue while the shared switch stays on, and a per-queue toggle **on** resumes just that queue while the shared switch is off.
- **Max passes** — how many times a job may be re-queued after dead-lettering before it stays in the failed set permanently (pass counter persisted in `job.data.dlqRetryCount`).
- **Base delay (ms)** — the first DLQ retry's delay; delays double per pass (base → 2×base → 4×base, capped at 1h). `queue_dlq_retry_base_delay_ms` is registered with a 30000 `defaultValue`; until a per-queue or shared value is set, the email processor's 60s constant is the fallback only when no registered default applies.

**Discover the effective policy** without reading source: `GET /v1/queue/dlq-policy` returns, per queue, `{ toggle, maxPasses, baseDelayMs }` each as `{ source: 'per-queue' | 'shared' | 'default', value, key }` — exactly what the processors will execute (per-job `retryDelay` overrides are job-level and not part of the queue policy).

**Manual intervention**: a job whose DLQ budget is exhausted (or retry was disabled) stays in the failed set. The plain `retry` endpoint keeps `attemptsMade`, so an attempts-exhausted job would fail again immediately — use **`POST /v1/queue/:queue/jobs/:jobId/retry-now`** instead: it re-queues the job with `resetAttemptsMade` (a fresh attempts budget) and clears `job.data.dlqRetryCount` (a fresh DLQ budget), so the next failure flows through the dead-letter machinery again. Only failed jobs are accepted.

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: platform@azeeboplus.com
- **Last Updated**: 2026-08-10
