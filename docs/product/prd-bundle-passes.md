# PRD: Bundle Passes

> Priority: P0 | Est. Effort: 4 days | Dependencies: subscription-service, payment-service

---

## Problem Statement

Users who enjoy multiple universes currently need to purchase separate passes for each. Bundle passes offer discounted access to multiple universes, increasing user retention and average revenue per user.

## User Stories

1. **As a viewer**, I want to buy a bundle that covers multiple universes at a discount
2. **As a viewer**, I want to see which universes are included in each bundle
3. **As a viewer**, I want to compare individual pass prices vs bundle prices
4. **As an admin**, I want to create and manage bundle configurations

## Requirements

### Functional
- [ ] Pre-configured bundles (e.g., "Entertainment Bundle", "All Access")
- [ ] Custom bundles (admin-created combinations)
- [ ] Bundle pricing with discount percentage display
- [ ] Bundle activation and renewal
- [ ] Individual universe pass upgrade to bundle
- [ ] Bundle validity period matching longest included pass

### Non-Functional
- [ ] Bundle pricing cached for 5 minutes
- [ ] Atomic bundle purchase (all-or-nothing)
- [ ] Prorated upgrades from individual passes

## Technical Design

### Database Changes
```prisma
model BundlePass {
  id              String   @id @default(uuid())
  name            String   @unique
  description     String
  universeIds     String[] // Included universe IDs
  price           Decimal  @db.Decimal(10, 2)
  originalPrice   Decimal  @db.Decimal(10, 2) // Sum of individual prices
  discountPercent Int      // Calculated discount
  duration        Int      // In days
  isActive        Boolean  @default(true)
  tier            String   // standard, premium, ultimate
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model BundleSubscription {
  id            String   @id @default(uuid())
  userId        String
  bundleId      String
  status        String   @default("active")
  startDate     DateTime @default(now())
  endDate       DateTime
  autoRenew     Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

### Pre-configured Bundles
| Bundle | Universes | Individual Price | Bundle Price | Discount |
|--------|-----------|-----------------|--------------|----------|
| Entertainment | Reality + Comedy + Movies | ₦3,000/mo | ₦2,100/mo | 30% |
| Creator Pack | Creator + Lifestyle | ₦2,000/mo | ₦1,500/mo | 25% |
| All Access | All 8 universes | ₦8,000/mo | ₦4,800/mo | 40% |
| Sports & Games | Sports + Games | ₦2,000/mo | ₦1,400/mo | 30% |

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bundles` | List available bundles |
| GET | `/bundles/:id` | Get bundle details |
| POST | `/bundles/:id/subscribe` | Subscribe to bundle |
| DELETE | `/bundles/:id/cancel` | Cancel bundle |
| GET | `/bundles/compare` | Compare individual vs bundle pricing |

### Integration Points
- **payment-service**: Bundle purchase processing
- **content-service**: Bundle access validation
- **subscription-service**: Bundle subscription management
- **notification-service**: Bundle renewal reminders

## Success Metrics
- 30% of pass purchases are bundles within 3 months
- Bundle subscribers have 2x longer retention than individual pass users
- Average revenue per user increases by 25%
- Bundle churn rate < 10% monthly
