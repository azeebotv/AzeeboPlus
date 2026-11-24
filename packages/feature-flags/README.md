# Feature Flag System

## Overview

This package provides a feature flag system for Azeebo+ services. Feature flags enable gradual rollouts, A/B testing, and quick rollbacks without deployment.

## Installation

```bash
pnpm add @azeebo/feature-flags
```

## Usage

### Basic Usage

```typescript
import { FeatureFlagService, paymentFlags } from '@azeebo/feature-flags';

// Initialize with your Redis connection
const featureFlagService = new FeatureFlagService({
  redisUrl: process.env.REDIS_URL,
});

// Check if a feature is enabled (typed key — never a string literal)
const isEnabled = await featureFlagService.isEnabled(paymentFlags.newCheckoutFlow);
if (isEnabled) {
  // Use new payment flow
}
```

### NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { FeatureFlagModule, paymentFlags, webFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    FeatureFlagModule.register({
      redisUrl: process.env.REDIS_URL,
      defaultFlags: {
        [paymentFlags.newCheckoutFlow]: false,
        [webFlags.darkMode]: true,
      },
    }),
  ],
})
export class AppModule {}
```

### Using the Guard

```typescript
import { FeatureFlagGuard, FeatureFlag } from '@azeebo/feature-flags';

@Controller('payments')
export class PaymentController {
  @Post('new-flow')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag('payment_new_checkout_flow')
  async newPaymentFlow() {
    // 403 unless 'payment_new_checkout_flow' is enabled
  }
}
```

### Typed registries

```typescript
import { paymentFlags } from '@azeebo/feature-flags';

// Compile-time checked keys — typos fail the build
await featureFlagService.isEnabled(paymentFlags.newCheckoutFlow, userId);
```

### Numeric / variant values

```typescript
FeatureFlagModule.register({
  defaultValues: { analytics_sampling_rate: 100 },
});

const rate = await featureFlagService.getValue('analytics_sampling_rate'); // 100 | stored value | null
```

## Flag Management

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FEATURE_FLAG_REDIS_URL` | Redis URL for flag storage | `redis://localhost:6379` |
| `FEATURE_FLAG_DEFAULT_*` | Per-flag default override (e.g. `FEATURE_FLAG_DEFAULT_WEB_DARK_MODE=true`) | registered default |

### Flag Naming Convention

- `{service}_{feature}` snake_case keys (e.g. `queue_dlq_retry_max_passes`), registered in `src/registries.ts`.
- Enforced by `pnpm check:flags` (`scripts/check-flag-conventions.mjs`).
- Rollout policy, monitoring gates and cleanup lifecycle: `docs/feature-flag-rollout-policy.md`.

### Flag Structure

```typescript
interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100 hash-bucket
  userIds?: string[]; // Targeted users always win
  value?: string | number | boolean | null; // Variant / numeric payload
  description?: string;
  owner?: string;
  staleAfter?: string; // Removal-candidate date (admin stale report)
  isPublic?: boolean; // Exposed via GET /feature-flags/bootstrap
  metadata?: Record<string, unknown>;
}
```

### Client bootstrap

`GET /feature-flags/bootstrap` (api-gateway) returns only `isPublic` flags,
evaluated **per user** (rollout % + allowlists bucketed on the caller id; anonymous
callers can send a stable `x-anonymous-id`):

```json
{
  "success": true,
  "data": {
    "flags": [{ "key": "web_maintenance_mode", "enabled": false }],
    "generatedAt": "2026-08-11T10:00:00Z",
    "evaluatedFor": "anonymous"
  }
}
```

## Admin API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/feature-flags` | List stored + default flags |
| PUT | `/api/v1/admin/feature-flags/:key` | Create/update (rollout %, userIds, value, staleAfter) |
| DELETE | `/api/v1/admin/feature-flags/:key` | Delete (falls back to default) |
| GET | `/api/v1/admin/feature-flags/stale` | Removal candidates past `staleAfter` |

Every update/delete is audit-logged (`feature_flag.updated` / `feature_flag.deleted`,
actor + old→new details).

## Best Practices

1. **Typed keys**: import from the registry — never string literals.
2. **Defaults**: risky/experimental features default OFF; existing behavior made reversible defaults ON.
3. **Kill-switches**: dangerous surfaces (payments, emails, CDN purge, DLQ retries) get service-level gates, not just route guards.
4. **Rollout**: 0% → 10% → 50% → 100% with monitoring gates (see rollout policy doc).
5. **Cleanup**: set `staleAfter` at 100%, remove 2 sprints later, sweep leftover `isEnabled` calls. Every flag must carry an `owner` (and default-on kill-switches a `staleAfter`) so the admin stale report and owner-notification sweep can track it.
6. **Monitoring**: `onEvaluation`/`onToggle` hooks exist for metrics wiring; flag state is audit-logged.

## Environments

| Environment | Description |
|-------------|-------------|
| Development | Local development with default flags (Redis at `FEATURE_FLAG_REDIS_URL`) |
| Staging | Testing flags with full access |
| Production | `FEATURE_FLAG_REDIS_URL` required — service throws if unset; gradual rollout with monitoring |