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
import { FeatureFlagService } from '@azeebo/feature-flags';

// Initialize with your Redis connection
const featureFlagService = new FeatureFlagService({
  redisUrl: process.env.REDIS_URL,
});

// Check if a feature is enabled
const isEnabled = await featureFlagService.isEnabled('new-payment-flow');
if (isEnabled) {
  // Use new payment flow
}
```

### NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { FeatureFlagModule } from '@azeebo/feature-flags';

@Module({
  imports: [
    FeatureFlagModule.register({
      redisUrl: process.env.REDIS_URL,
      defaultFlags: {
        'new-payment-flow': false,
        'dark-mode': true,
      },
    }),
  ],
})
export class AppModule {}
```

### Using the Guard

```typescript
import { FeatureFlagGuard } from '@azeebo/feature-flags';

@Controller('payments')
export class PaymentController {
  constructor(
    private featureFlagService: FeatureFlagService,
    private featureFlagGuard: FeatureFlagGuard,
  ) {}

  @Post('new-flow')
  @UseGuards(FeatureFlagGuard)
  async newPaymentFlow() {
    // Only accessible when 'new-payment-flow' flag is enabled
  }
}
```

## Flag Management

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FEATURE_FLAG_REDIS_URL` | Redis URL for flag storage | `redis://localhost:6379` |
| `FEATURE_FLAG_DEFAULT_*` | Default value for a flag | `false` |

### Flag Naming Convention

Flags should follow snake_case naming:
- `new_payment_flow`
- `dark_mode`
- `video_autoplay`

### Flag Structure

Each flag has the following properties:
```typescript
interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  userIds?: string[]; // Users who always have access
  description?: string;
  metadata?: Record<string, unknown>;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feature-flags` | List all flags |
| GET | `/feature-flags/:key` | Get flag status |
| POST | `/feature-flags` | Create/update flag |
| DELETE | `/feature-flags/:key` | Delete flag |

### Example Response

```json
{
  "success": true,
  "data": {
    "key": "new_payment_flow",
    "enabled": true,
    "rolloutPercentage": 50,
    "description": "Enable new payment processing flow",
    "metadata": {
      "owner": "payments-team",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

## Best Practices

1. **Flag Naming**: Use descriptive names with underscores (e.g., `enable_dark_mode`)
2. **Default Values**: Always set sensible defaults in code
3. **Rollout**: Start with 0% and gradually increase
4. **Cleanup**: Remove flags after full rollout within 2 sprints
5. **Monitoring**: Track flag metrics in analytics

## Environments

| Environment | Description |
|-------------|-------------|
| Development | Local development with default flags |
| Staging | Testing flags with full access |
| Production | Gradual rollout with monitoring |