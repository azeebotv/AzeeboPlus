# Azeebo+ Error Handling Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Error Handling Overview

Azeebo+ implements consistent error handling across all applications and services to provide reliable user experiences.

---

## Error Types

### Client Errors (4xx)

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Not authorized |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Business logic conflict |
| 422 | Validation Error - Invalid data |
| 429 | Too Many Requests - Rate limited |

### Server Errors (5xx)

| Code | Description |
|------|-------------|
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |
| 504 | Gateway Timeout |

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "reason": "must be a valid email address"
    }
  }
}
```

---

## Error Codes

### Auth Errors

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_TOKEN_INVALID`
- `AUTH_MFA_REQUIRED`
- `AUTH_ACCOUNT_LOCKED`

### Validation Errors

- `VALIDATION_ERROR`
- `INVALID_INPUT`
- `MISSING_REQUIRED_FIELD`

### Payment Errors

- `PAYMENT_FAILED`
- `PAYMENT_INSUFFICIENT_FUNDS`
- `PAYMENT_CANCELLED`
- `PAYMENT_ALREADY_PROCESSED`

### Wallet Errors

- `WALLET_INSUFFICIENT_BALANCE`
- `WALLET_TRANSACTION_FAILED`
- `WALLET_INVALID_OPERATION`

---

## Frontend Error Handling

### Screen States

Every screen MUST handle:

1. **Loading State**
   - Show skeleton or spinner
   - Don't show stale data

2. **Empty State**
   - Clear message
   - Action to resolve

3. **Error State**
   - User-friendly message
   - Retry button
   - Support contact if needed

4. **Success State**
   - Confirmation
   - Next action guidance

### Error Boundaries (React)

```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error tracking
    logError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## Backend Error Handling

### Service Layer

- Throw domain-specific errors
- Include context for debugging
- Don't expose internal details

### Controller Layer

- Catch and transform errors
- Return appropriate HTTP codes
- Log errors appropriately

### Global Handler

- Catch unhandled errors
- Return 500 for unexpected errors
- Log full error details

---

## Logging Errors

### Structured Log Format

```json
{
  "timestamp": "2026-04-23T10:30:00Z",
  "level": "ERROR",
  "traceId": "abc-123-def",
  "service": "payment-service",
  "message": "Payment processing failed",
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Gateway timeout",
    "stack": "..."
  },
  "context": {
    "userId": "user-123",
    "amount": 1000,
    "paymentId": "pay-456"
  }
}
```

### What to Log

- Error code and message
- Stack trace (server-side)
- Request context
- User ID (if authenticated)
- Correlation IDs

### What NOT to Log

- Passwords or tokens
- Full request bodies (may contain PII)
- Internal system details

---

## User-Facing Messages

### Do

- Be clear and concise
- Explain what happened
- Suggest next steps
- Be empathetic

### Don't

- Show technical details
- Blame the user
- Use jargon
- Be overly formal

---

## Prohibited Actions

- No exposing stack traces to users
- No showing internal error codes
- No logging sensitive data
- No swallowing errors silently