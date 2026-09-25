# @azeebo/event-bus

Cross-service event bus for Azeebo+ using Redis pub/sub and BullMQ.

## Features

- Redis pub/sub for real-time cross-service events
- BullMQ for durable job queues
- Automatic retry with exponential backoff
- Event type safety with TypeScript generics

## Usage

```ts
import { EventBus } from '@azeebo/event-bus';

const bus = new EventBus({ redisUrl: process.env.REDIS_URL });

// Publish event
await bus.publish('content.created', { contentId: '123', universe: 'reality' });

// Subscribe to event
await bus.subscribe('content.created', async (payload) => {
  console.log('New content:', payload.contentId);
});
```

## Exports

| Export | Description |
|--------|-------------|
| `EventBus` | Redis pub/sub event bus |
| `EventBusModule` | NestJS module for dependency injection |
