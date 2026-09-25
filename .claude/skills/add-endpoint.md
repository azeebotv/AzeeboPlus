# Skill: Add Endpoint

> Add a new API endpoint to an existing NestJS service.

---

## Usage

```
/add-endpoint [service] [module] [method] [path]

Example:
/add-endpoint reality-service reality POST /vote
/add-endpoint wallet-service wallet GET /balance
/add-endpoint creator-service creator PATCH /:id
```

## What It Does

1. Adds the controller method with proper decorators
2. Creates DTO class with validation
3. Adds service method with business logic
4. Updates module imports if needed
5. Adds unit test stub
6. Adds analytics event if conversion action

## Template: Controller Method

```typescript
@Post('vote')
@UseGuards(AuthGuard)
async vote(@Body() dto: VoteDto, @Request() req) {
  return this.realityService.vote(dto, req.user.id);
}
```

## Template: DTO

```typescript
import { IsString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class VoteDto {
  @IsUUID()
  showId: string;

  @IsUUID()
  contestantId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
```

## Template: Service Method

```typescript
async vote(dto: VoteDto, userId: string) {
  // 1. Validate input
  // 2. Check business rules
  // 3. Call wallet-service for payment (if paid action)
  // 4. Create database record
  // 5. Emit analytics event
  // 6. Return result
}
```

## Rules

- Always use `@UseGuards(AuthGuard)` for authenticated endpoints
- Always use DTOs with class-validator decorators
- Never hardcode prices — fetch from database
- Always validate business rules before database operations
- Add analytics events on conversion actions
- Use proper HTTP status codes (201 for create, 200 for get, 204 for delete)
