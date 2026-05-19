# E2E Test Specifications

This document specifies end-to-end tests for critical user journeys in the Azeebo platform.

## Test Framework

- **Web**: Playwright
- **Mobile**: Detox (React Native)
- **CI Integration**: GitHub Actions with environment-specific configurations

## Test User Journeys

### 1. Onboarding & Authentication

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `signup-flow` | User can sign up with email, verify email, and complete profile | P0 |
| `login-flow` | User can login with email/password and receive JWT tokens | P0 |
| `logout-flow` | User can logout and session is invalidated | P1 |
| `password-reset-flow` | User can request password reset and update password | P1 |
| `mfa-enrollment` | User can enroll in MFA and use TOTP for login | P1 |
| `mfa-login` | User can login with MFA verification | P0 |

### 2. Wallet & Payments

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `wallet-creation` | New user gets wallet created automatically | P0 |
| `wallet-funding-card` | User can fund wallet via card payment (Paystack) | P0 |
| `wallet-funding-bank` | User can fund wallet via bank transfer | P1 |
| `wallet-balance` | User can view wallet balance and transaction history | P0 |
| `wallet-withdrawal` | User can withdraw funds to bank account | P1 |
| `duplicate-webhook` | Duplicate payment webhooks are handled idempotently | P0 |
| `refund-flow` | User can request and receive refund | P1 |

### 3. Content Consumption

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `content-browse` | User can browse and search content | P0 |
| `content-watch-free` | User can watch free content | P0 |
| `content-watch-premium` | Premium user can watch premium content | P0 |
| `content-rental` | User can rent movie for viewing window | P1 |
| `watchlist-add` | User can add content to watchlist | P1 |
| `watch-history` | User can view watch history | P1 |

### 4. Reality Voting

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `vote-free` | User can cast free votes | P0 |
| `vote-paid` | User can cast paid votes with wallet deduction | P0 |
| `supervote` | User can purchase and cast supervotes | P1 |
| `prediction` | User can submit predictions for shows | P1 |
| `leaderboard-view` | User can view vote/prediction leaderboards | P1 |
| `reward-redemption` | User can redeem earned rewards | P0 |

### 5. Creator Flows

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `creator-onboarding` | Creator can complete onboarding and verification | P1 |
| `content-upload` | Creator can upload videos and images | P0 |
| `channel-management` | Creator can manage channel settings and content | P1 |
| `tip-receive` | Creator receives tips from fans | P0 |
| `subscription-manage` | Creator can manage subscriber tiers | P1 |
| `earnings-view` | Creator can view earnings and payout history | P0 |
| `payout-request` | Creator can request payout | P1 |

### 6. Sports Predictions

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `prediction-market-browse` | User can browse prediction markets | P1 |
| `prediction-place` | User can place prediction with fee | P0 |
| `prediction-correct` | Correct prediction awards rewards | P0 |
| `fan-contest-join` | User can join fan contest with entry fee | P1 |
| `leaderboard-view` | User can view sports leaderboards | P1 |

### 7. Support & Moderation

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `support-ticket-create` | User can create support ticket | P1 |
| `support-ticket-reply` | User can reply to ticket | P1 |
| `report-content` | User can report content | P0 |
| `admin-moderation` | Moderator can review and act on reports | P1 |
| `takedown-request` | Admin can request content takedown | P1 |
| `appeal-submit` | User can appeal moderation decision | P1 |

### 8. Admin Operations

| Test Case | Description | Priority |
|-----------|-------------|----------|
| `admin-user-suspend` | Admin can suspend user account | P1 |
| `admin-content-manage` | Admin can manage content visibility | P1 |
| `admin-rewards-config` | Admin can configure reward rules | P1 |
| `admin-analytics-view` | Admin can view platform analytics | P1 |
| `admin-audit-logs` | Admin can view audit logs | P1 |

## Playwright Web E2E Structure

```typescript
// e2e/web/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test('signup-flow', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    // Verify email redirect
    await expect(page).toHaveURL(/\/verify-email/);
  });
});
```

## Detox Mobile E2E Structure

```typescript
// e2e/mobile/onboarding.spec.ts
import { describe, it, beforeEach } from 'detox';
import { by, waitFor, element } from 'detox';

describe('Onboarding', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('signup-flow', async () => {
    await element(by.id('signupButton')).tap();
    await element(by.id('emailInput')).typeText('test@example.com');
    await element(by.id('passwordInput')).typeText('SecurePass123!');
    await element(by.id('submitButton')).tap();
    await waitFor(element(by.id('emailVerificationScreen'))).toBeVisible();
  });
});
```

## Running Tests

```bash
# Web E2E
npm run test:e2e:web

# Mobile E2E
npm run test:e2e:mobile

# All E2E
npm run test:e2e

# With specific tags
npm run test:e2e:web -- --grep "@p0"
```

## CI Configuration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  web-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:web
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

  mobile-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:e2e:mobile
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
```

## Test Data Management

- Use factory functions for test data creation
- Clean up test data after each test
- Use unique identifiers to avoid conflicts
- Mock external services where appropriate