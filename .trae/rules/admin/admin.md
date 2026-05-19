# Azeebo+ Admin Panel Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Technology Stack

| Component | Technology | Enforcement |
|-----------|-----------|-------------|
| Framework | Next.js | MUST |
| Language | TypeScript | MUST |
| UI Library | Component-driven architecture | MUST |
| State Management | React Query + Context | SHOULD |

---

## Admin Panel Overview

The admin panel is the backoffice interface for managing the Azeebo+ platform. It provides tools for content management, user management, moderation, analytics, and platform configuration.

---

## Core Admin Modules

### 1. Dashboard

**Purpose:** Executive overview of platform health

**Key Metrics:**
- Daily active users
- Revenue summary
- Content uploads
- Creator signups
- Support tickets
- Moderation queue size

### 2. Content Management

**Features:**
- Content listing with filters
- Content creation/editing
- Publishing workflow
- Content scheduling
- Bulk operations

**API Endpoints:**
```
GET    /v1/admin/content
POST   /v1/admin/content
PATCH  /v1/admin/content/{id}
POST   /v1/admin/content/{id}/publish
POST   /v1/admin/content/{id}/unpublish
```

### 3. Reality Management

**Features:**
- Show management
- Season/episode management
- Contestant management
- Vote analytics dashboard
- Prediction monitoring

**API Endpoints:**
```
GET   /v1/admin/reality/shows
POST  /v1/admin/reality/shows
POST  /v1/admin/reality/contestants
PATCH /v1/admin/reality/contestants/{id}
GET   /v1/admin/reality/vote-analytics
```

### 4. Creator Management

**Features:**
- Creator listing
- Verification workflow
- Earnings review
- Payout management
- Creator analytics

**API Endpoints:**
```
GET  /v1/admin/creators
POST /v1/admin/creators/{id}/verify
GET  /v1/admin/creators/earnings-review
```

### 5. Moderation Center

**Features:**
- Report queue
- Content review
- User actions (warn, suspend, ban)
- Appeal handling
- Trust score management

**API Endpoints:**
```
GET  /v1/admin/moderation/reports
POST /v1/admin/moderation/reports/{id}/resolve
POST /v1/admin/moderation/actions
```

### 6. Rewards Management

**Features:**
- Reward rules configuration
- Badge management
- Challenge setup
- Redemption review

**API Endpoints:**
```
GET   /v1/admin/rewards/rules
POST  /v1/admin/rewards/rules
PATCH /v1/admin/rewards/rules/{id}
```

### 7. Analytics Dashboard

**Features:**
- Executive metrics
- Funnel analysis
- Cohort analysis
- Universe-specific KPIs
- Export functionality

**API Endpoints:**
```
GET /v1/admin/analytics/dashboard
GET /v1/admin/analytics/funnels
GET /v1/admin/analytics/cohorts
GET /v1/admin/analytics/universes/{name}
```

### 8. User Management

**Features:**
- User search
- Profile viewing
- Account actions
- Role management
- Session management

### 9. Payment & Wallet Management

**Features:**
- Transaction monitoring
- Refund processing
- Fraud detection alerts
- Wallet adjustments
- Payment provider status

### 10. Notification Management

**Features:**
- Notification templates
- Campaign management
- Broadcast messages
- Notification logs

---

## Admin Roles & Permissions

### Role Hierarchy

| Role | Access Level |
|------|-------------|
| `super_admin` | Full platform access |
| `admin` | Platform management |
| `moderator` | Content moderation |
| `support` | User support tools |
| `analyst` | Read-only analytics |
| `partner` | Sponsor dashboard |

### Permission Categories

- **Content:** Create, edit, publish, delete
- **Users:** View, edit, suspend, ban
- **Creators:** Verify, manage payouts
- **Moderation:** Review, action, resolve
- **Analytics:** View, export
- **Settings:** Configure platform
- **Payments:** Process refunds, view transactions

---

## UI/UX Requirements

### Every Admin Screen MUST Include

- Loading state
- Empty state
- Error state
- Success confirmation
- Retry option

### Design Principles

- Clean, professional interface
- Clear navigation hierarchy
- Responsive design (desktop-first)
- Keyboard shortcuts for power users
- Bulk action support
- Advanced filtering
- Export functionality

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

---

## Security Requirements

### Authentication

- MFA MUST be enforced for all admin accounts
- Session timeout after inactivity
- IP allowlisting (optional)
- Audit logging of all actions

### Authorization

- Server-side RBAC enforcement
- Default policy: DENY
- All permission checks MUST be explicit
- No client-side permission decisions

### Audit Trail

**All admin actions MUST be logged:**
- Actor (admin user)
- Action performed
- Resource affected
- Timestamp
- IP address
- User agent
- Before/after state (for changes)

---

## Admin API Security

### Endpoint Protection

- All admin endpoints MUST require authentication
- All admin endpoints MUST require appropriate role
- Rate limiting MUST be applied
- Input validation MUST be strict

### Sensitive Operations

**Require additional verification:**
- User bans/suspensions
- Payment refunds
- Role changes
- Content deletion
- Payout approvals

---

## Data Tables & Lists

### Standard Table Features

- Sortable columns
- Filterable columns
- Pagination
- Row selection
- Bulk actions
- Export to CSV/Excel
- Column visibility toggle

### List View States

- Loading skeleton
- Empty state with CTA
- Error state with retry
- No results state (when filtering)

---

## Forms & Validation

### Form Requirements

- Client-side validation (immediate feedback)
- Server-side validation (security)
- Clear error messages
- Field-level validation
- Form-level validation
- Unsaved changes warning

### Validation Rules

- All inputs MUST be validated
- Use whitelist approach
- Sanitize all user input
- Validate file uploads
- Enforce length limits

---

## Notifications & Feedback

### Toast Notifications

- Success (green)
- Error (red)
- Warning (yellow)
- Info (blue)

### Confirmation Dialogs

**Required for destructive actions:**
- Delete operations
- Ban/suspend users
- Refund payments
- Bulk operations

---

## Performance Guidelines

### Data Loading

- Use pagination for large datasets
- Implement lazy loading where appropriate
- Cache frequently accessed data
- Debounce search inputs

### Optimization

- Code splitting by module
- Lazy load heavy components
- Optimize images and assets
- Use React.memo for expensive renders

---

## Prohibited Actions

- No storing secrets in localStorage
- No client-side permission decisions
- No bypassing confirmation dialogs
- No direct database queries from frontend
- No exposing internal API structure
