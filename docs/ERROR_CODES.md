# Azeebo+ Error Code Reference

## Overview

All API errors follow a consistent format with machine-readable error codes and human-readable messages.

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Authentication Errors (401)

| Code | Message | Resolution |
|------|---------|------------|
| UNAUTHORIZED | Authentication required | Provide valid access token |
| TOKEN_EXPIRED | Access token has expired | Refresh token or login again |
| TOKEN_INVALID | Access token is invalid | Check token format and validity |
| TOKEN_REVOKED | Token has been revoked | Login again |
| MFA_REQUIRED | Multi-factor authentication required | Complete MFA verification |
| MFA_INVALID | Invalid MFA code | Check MFA code and try again |
| SESSION_EXPIRED | Session has expired | Login again |
| INVALID_CREDENTIALS | Invalid email or password | Check credentials and try again |
| ACCOUNT_DISABLED | Account has been disabled | Contact support |

## Authorization Errors (403)

| Code | Message | Resolution |
|------|---------|------------|
| FORBIDDEN | Insufficient permissions | Contact administrator |
| ROLE_REQUIRED | Required role not assigned | Contact administrator |
| OWNERSHIP_REQUIRED | Must own resource | Verify resource ownership |
| UNIVERSE_ACCESS_DENIED | No access to this universe | Check universe permissions |

## Validation Errors (400)

| Code | Message | Resolution |
|------|---------|------------|
| VALIDATION_ERROR | Request validation failed | Check request body and try again |
| INVALID_EMAIL | Invalid email format | Use valid email address |
| INVALID_PHONE | Invalid phone format | Use valid phone number |
| PASSWORD_TOO_SHORT | Password must be at least 8 characters | Use longer password |
| INVALID_DATE | Invalid date format | Use ISO 8601 format |
| INVALID_AMOUNT | Invalid amount | Check amount is positive number |
| FILE_TOO_LARGE | File exceeds size limit | Reduce file size |
| INVALID_FILE_TYPE | File type not allowed | Use allowed file type |
| MISSING_FIELD | Required field missing | Provide required field |

## Resource Errors (404)

| Code | Message | Resolution |
|------|---------|------------|
| NOT_FOUND | Resource not found | Check resource ID |
| USER_NOT_FOUND | User not found | Check user ID |
| CONTENT_NOT_FOUND | Content not found | Check content ID |
| TICKET_NOT_FOUND | Support ticket not found | Check ticket ID |
| PAYMENT_NOT_FOUND | Payment not found | Check payment ID |
| WALLET_NOT_FOUND | Wallet not found | Contact support |
| NOTIFICATION_NOT_FOUND | Notification not found | Check notification ID |

## Rate Limiting Errors (429)

| Code | Message | Resolution |
|------|---------|------------|
| RATE_LIMITED | Too many requests | Wait and try again |
| RATE_LIMIT_EXCEEDED | Rate limit exceeded | Wait and try again |

## Payment Errors

| Code | Message | Resolution |
|------|---------|------------|
| PAYMENT_FAILED | Payment processing failed | Try again or use different method |
| INSUFFICIENT_FUNDS | Insufficient wallet balance | Add funds to wallet |
| PAYMENT_DECLINED | Payment declined by provider | Try different payment method |
| REFUND_FAILED | Refund processing failed | Contact support |
| INVALID_PROVIDER | Invalid payment provider | Check provider configuration |

## Wallet Errors

| Code | Message | Resolution |
|------|---------|------------|
| INSUFFICIENT_BALANCE | Insufficient balance | Add funds to wallet |
| TRANSACTION_FAILED | Transaction failed | Try again |
| INVALID_TRANSACTION | Invalid transaction | Check transaction details |
| WALLET_LOCKED | Wallet is locked | Contact support |

## Content Errors

| Code | Message | Resolution |
|------|---------|------------|
| CONTENT_ARCHIVED | Content is archived | Content no longer available |
| CONTENT_DRAFT | Content is draft | Content not yet published |
| CONTENT_RESTRICTED | Content is restricted | Check access permissions |
| MEDIA_PROCESSING_FAILED | Media processing failed | Re-upload media file |

## System Errors (500)

| Code | Message | Resolution |
|------|---------|------------|
| INTERNAL_ERROR | Internal server error | Try again later |
| SERVICE_UNAVAILABLE | Service temporarily unavailable | Try again later |
| DATABASE_ERROR | Database error | Try again later |
| CACHE_ERROR | Cache error | Try again later |

## Last Updated: 2026-05-18
