# Azeebo+ Shared Packages Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

Shared packages provide reusable code, types, and utilities across all Azeebo+ applications (mobile, web, admin) and services (backend).

---

## Package Structure

```
packages/
├── ui/                  # Shared UI components
├── design-tokens/       # Design tokens (colors, spacing, typography)
├── api-client/          # Shared API client
├── shared-types/        # TypeScript types and interfaces
├── utils/               # Utility functions
└── analytics-sdk/       # Analytics instrumentation
```

---

## Design Tokens

### Color Tokens

| Token | Usage | Value |
|-------|-------|-------|
| `primary` | Primary actions | Brand color |
| `secondary` | Secondary actions | Supporting color |
| `accent` | Highlights | Attention color |
| `success` | Success states | Green |
| `warning` | Warning states | Yellow |
| `error` | Error states | Red |
| `background.primary` | Main background | Dark/Light |
| `background.secondary` | Card backgrounds | Elevated |
| `text.primary` | Main text | High contrast |
| `text.secondary` | Supporting text | Medium contrast |
| `text.muted` | Disabled/hint text | Low contrast |

### Typography Tokens

| Token | Usage | Size | Weight |
|-------|-------|------|--------|
| `font.h1` | Page titles | 32px | Bold |
| `font.h2` | Section headers | 24px | Bold |
| `font.h3` | Card titles | 20px | SemiBold |
| `font.body` | Main content | 16px | Regular |
| `font.caption` | Supporting text | 14px | Regular |
| `font.small` | Labels | 12px | Medium |

### Spacing Tokens

| Token | Value |
|-------|-------|
| `spacing.xs` | 4px |
| `spacing.sm` | 8px |
| `spacing.md` | 16px |
| `spacing.lg` | 24px |
| `spacing.xl` | 32px |
| `spacing.2xl` | 48px |

### Border Radius Tokens

| Token | Value |
|-------|-------|
| `radius.sm` | 4px |
| `radius.md` | 8px |
| `radius.lg` | 12px |
| `radius.xl` | 16px |
| `radius.full` | 9999px |

### Shadow Tokens

| Token | Usage |
|-------|-------|
| `shadow.sm` | Subtle elevation |
| `shadow.md` | Card elevation |
| `shadow.lg` | Modal/dropdown |
| `shadow.xl` | Full screen overlays |

---

## Shared Types

### Core Types

```typescript
// User types
interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

type UserRole = 'user' | 'creator' | 'moderator' | 'admin' | 'super_admin' | 'partner' | 'sponsor_manager';

// Content types
interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  thumbnail: string;
  mediaUrl?: string;
  universe: Universe;
  status: PublishStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

type ContentType = 'video' | 'audio' | 'image' | 'article';
type Universe = 'reality' | 'creator' | 'lifestyle' | 'vertical' | 'movie' | 'games' | 'comedy' | 'sports';
type PublishStatus = 'draft' | 'pending' | 'published' | 'archived';

// Wallet types
interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  bonusBalance: number;
  promoBalance: number;
}

interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  reference: string;
  createdAt: Date;
}

type TransactionType = 'credit' | 'debit' | 'bonus' | 'promo' | 'refund';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

// Reward types
interface RewardAccount {
  userId: string;
  points: number;
  level: number;
  streak: number;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

---

## API Client

### Configuration

```typescript
interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  authStorageKey: string;
}
```

### Features

- Automatic token refresh
- Request/response interceptors
- Error handling
- Type-safe requests
- Retry logic
- Request cancellation

### Usage

```typescript
import { apiClient } from '@azeebo/api-client';

// GET request
const user = await apiClient.get<User>('/users/me');

// POST request
const result = await apiClient.post<PaymentIntent>('/payments/initialize', {
  amount: 1000,
  currency: 'NGN'
});
```

---

## Analytics SDK

### Event Tracking

```typescript
import { analytics } from '@azeebo/analytics-sdk';

// Track event
analytics.track('payment_initiated', {
  userId: 'user-123',
  amount: 1000,
  currency: 'NGN'
});

// Track screen view
analytics.screen('HomeScreen', {
  universe: 'reality'
});
```

### Event Envelope

Every event MUST include:
- `user_id`
- `session_id`
- `platform`
- `universe`
- `content_id` (if relevant)
- `timestamp`
- `device_info`
- `app_version`
- `experiment_flags` (if any)

---

## Utility Functions

### Common Utilities

- `formatCurrency(amount, currency)` - Format money
- `formatDate(date, format)` - Format dates
- `formatDuration(seconds)` - Format video duration
- `truncate(text, length)` - Truncate text
- `debounce(fn, delay)` - Debounce function
- `throttle(fn, limit)` - Throttle function
- `generateId()` - Generate unique ID
- `parseJwt(token)` - Parse JWT payload

### Validation Utilities

- `isValidEmail(email)` - Email validation
- `isValidPhone(phone)` - Phone validation
- `isValidPassword(password)` - Password strength
- `sanitizeHtml(html)` - Sanitize HTML

---

## Prohibited Patterns

- No hardcoded API URLs in shared packages
- No environment-specific configuration
- No business logic in shared packages
- No direct API calls without using api-client
- No analytics events without using analytics-sdk