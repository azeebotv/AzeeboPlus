# @azeebo/queue-policy

Shared BullMQ job-retention policy for Azeebo+ queue consumers.

`queue-service` and `engagement-service` both register `BullModule.forRoot()`.
Keeping the completed/failed job retention windows in this one package — rather
than hand-copying them into each service's `defaultJobOptions` — means the two
services can't silently drift on how long finished jobs are kept around.

## Usage

```ts
import { BullModule } from '@nestjs/bullmq';
import { JOB_RETENTION_POLICY } from '@azeebo/queue-policy';

BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: JOB_RETENTION_POLICY,
});
```

## Exports

| Export | Description |
|--------|-------------|
| `JOB_RETENTION_POLICY` | Canonical `defaultJobOptions` retention (`removeOnComplete` / `removeOnFail`) |
| `JobRetentionPolicy` | Type of the policy |
| `KeepJobsPolicy` | Shape of one retention window (BullMQ `KeepJobs`) |

## Policy

- **Completed** jobs are pruned after 1 day, or once 1000 remain.
- **Failed** jobs (which ops may need to inspect or re-run) are kept for a full
  week, or until 5000 remain.
