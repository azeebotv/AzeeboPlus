# @azeebo/opentelemetry

OpenTelemetry instrumentation for Azeebo+ services.

## Features

- Distributed tracing across microservices
- Prometheus metrics export
- Custom spans for database queries and HTTP calls
- Error budget tracking

## Usage

```ts
import { TracingService } from '@azeebo/opentelemetry';

@Injectable()
export class MyService {
  constructor(private readonly tracing: TracingService) {}

  async doWork() {
    return this.tracing.withSpan('my-operation', async () => {
      // Your logic here
    });
  }
}
```
