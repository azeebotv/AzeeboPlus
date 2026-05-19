# @azeebo/test-utils

Shared testing utilities for Azeebo services.

## Installation

```bash
npm install @azeebo/test-utils
```

## Usage

### TestDatabase

For integration tests with real PostgreSQL:

```typescript
import { TestDatabase } from '@azeebo/test-utils';

const db = new TestDatabase();

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.disconnect();
});

beforeEach(async () => {
  await db.cleanDatabase();
});

// Use in tests
const user = await db.createTestUser({ email: 'test@example.com' });
const wallet = await db.createTestWallet(user.id);
```

### Mock Services

```typescript
import { MockAuthService, MockWalletService } from '@azeebo/test-utils';

const auth = new MockAuthService();
const wallet = new MockWalletService();

// Add test users
auth.addUser('user-123', ['user']);
auth.addUser('admin-456', ['user', 'admin']);

// Create wallets
const walletId = wallet.createWallet('user-123', 100000);
```

### Test Helpers

```typescript
import { 
  generateTestJwt, 
  generateIdempotencyKey,
  testUserPayload,
  testWalletPayload,
} from '@azeebo/test-utils';

// Generate test JWT
const token = generateTestJwt('user-123', ['user']);

// Use predefined test payloads
console.log(testUserPayload.id);
```

### Create Test Context

```typescript
import { createTestContext } from '@azeebo/test-utils';

const ctx = createTestContext();

beforeAll(async () => {
  await ctx.setup();
});

afterAll(async () => {
  await ctx.teardown();
});

// Access services
const user = await ctx.db.createTestUser();
ctx.auth.addUser(user.id);
```

## Available Utilities

| Utility | Purpose |
|---------|---------|
| `TestDatabase` | PostgreSQL test database management |
| `MockAuthService` | Mock authentication service |
| `MockWalletService` | Mock wallet service |
| `generateTestJwt()` | Generate test JWT tokens |
| `generateIdempotencyKey()` | Generate UUID idempotency keys |
| `createTestContext()` | Create full test context |
| `testUserPayload` | Pre-defined test user |
| `testWalletPayload` | Pre-defined test wallet |
| `testVotePayload` | Pre-defined test vote |
| `testPaymentPayload` | Pre-defined test payment |
| `testAnalyticsEventPayload` | Pre-defined analytics event |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_DATABASE_URL` | - | PostgreSQL test database URL |