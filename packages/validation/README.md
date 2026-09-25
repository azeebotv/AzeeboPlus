# @azeebo/validation

Shared validation schemas and interceptors for Azeebo+.

## Features

- `SanitizeOutputInterceptor` — Strips sensitive fields from API responses
- `ValidationModule` — Global validation pipe configuration
- Zod schemas for common data types

## Usage

```ts
import { ValidationModule, SanitizeOutputInterceptor } from '@azeebo/validation';

@Module({
  imports: [ValidationModule],
  providers: [SanitizeOutputInterceptor],
})
export class MyModule {}
```
