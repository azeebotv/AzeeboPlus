# Code Review Checklist

Use this checklist before submitting or approving a pull request.

## General

- [ ] No duplicate shared logic - shared code should be in packages/
- [ ] All states handled (loading, error, empty, success)
- [ ] No commented-out code
- [ ] No console.log statements (use proper logging)
- [ ] No TODO comments without linked issue
- [ ] Code follows project naming conventions

## TypeScript/JavaScript

- [ ] No `unknown as` casts - use proper typing
- [ ] No `any` types without explicit justification
- [ ] Interfaces/types properly defined
- [ ] Null/undefined handling is explicit
- [ ] Async/await used correctly (no unhandled promises)

## API & Responses

- [ ] API response uses ApiResponseWrapper from @azeebo/shared-types
- [ ] Error codes are descriptive and follow naming convention
- [ ] HTTP status codes are appropriate
- [ ] Pagination implemented for list endpoints
- [ ] Request validation with class-validator DTOs

## Security

- [ ] No hardcoded credentials or secrets
- [ ] User input properly sanitized
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (proper escaping)
- [ ] CSRF protection where applicable
- [ ] Rate limiting on public endpoints
- [ ] Authentication/authorization properly enforced

## Payment & Financial

- [ ] No hardcoded prices - prices come from config/database
- [ ] Amount validation on server-side
- [ ] Database transactions for wallet operations
- [ ] Webhook signature verification
- [ ] Idempotency for payment operations
- [ ] Decimal precision handled (use integers for currency)

## Analytics

- [ ] Analytics events added for new features
- [ ] Event names follow snake_case convention
- [ ] User ID and session ID properly tracked
- [ ] Universe correctly specified

## Testing

- [ ] Unit tests for new service methods
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] No failing tests in CI

## Database

- [ ] Migrations created for schema changes
- [ ] Indexes added for foreign keys
- [ ] No N+1 queries (use includes/eager loading)
- [ ] Soft deletes where appropriate

## Performance

- [ ] No memory leaks (event listeners, subscriptions)
- [ ] Proper pagination for large datasets
- [ ] Caching implemented for expensive operations
- [ ] Connection pooling configured

## Mobile-First

- [ ] Responsive design works on all screen sizes
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scrolling
- [ ] Loading states for network requests
- [ ] Offline handling where appropriate

## Documentation

- [ ] Complex logic has explanatory comments
- [ ] README updated if adding new service
- [ ] API changes documented
- [ ] Environment variables documented