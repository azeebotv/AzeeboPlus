# Production Smoke Testing Checklist

## Pre-Test Preparation
- [ ] All pods running and healthy (`kubectl get pods -n azeebo`)
- [ ] All services available (`kubectl get svc -n azeebo`)
- [ ] All ingress working (`kubectl get ingress -n azeebo`)
- [ ] Database connected and healthy
- [ ] Redis connected and healthy
- [ ] Certificates valid (no expirations)
- [ ] DNS propagated (check multiple regions/ISPs)
- [ ] Monitoring dashboards healthy
- [ ] Logging pipeline working
- [ ] Payment providers in production mode configured
- [ ] Notification providers configured
- [ ] No critical alerts firing
- [ ] Test users created in production (cleanup after testing)

---

## Infrastructure & Health Checks

### Core Services
- [ ] Auth service health endpoint returns 200
- [ ] User service health endpoint returns 200
- [ ] Wallet service health endpoint returns 200
- [ ] Payment service health endpoint returns 200
- [ ] Content service health endpoint returns 200
- [ ] Notification service health endpoint returns 200
- [ ] Search service health endpoint returns 200
- [ ] Analytics service health endpoint returns 200
- [ ] Moderation service health endpoint returns 200
- [ ] Recommendation service health endpoint returns 200
- [ ] API Gateway health endpoint returns 200
- [ ] Web app health endpoint returns 200
- [ ] Admin portal health endpoint returns 200

### Infrastructure
- [ ] Database replication working (no lag)
- [ ] Redis replication working (if applicable)
- [ ] CDN serving static assets
- [ ] Media upload/download working (signed URLs)
- [ ] All HPA targets healthy
- [ ] Auto-scaling group capacity adequate
- [ ] Network policies applied correctly

---

## Authentication & User Management

### Authentication Flow
- [ ] New user registration works (email verification)
- [ ] User login with email/password works (JWT returned)
- [ ] Password reset flow works
- [ ] MFA can be enabled and works
- [ ] Session logout works (token invalidated)
- [ ] Token refresh works

### User Profile
- [ ] Can view user profile
- [ ] Can edit user profile information
- [ ] Can upload profile picture
- [ ] Can change password
- [ ] User settings save correctly

---

## Content Features

### Content Discovery
- [ ] Home page loads and shows content
- [ ] Can browse content by universe
- [ ] Content feed infinite scroll works
- [ ] Content search returns relevant results
- [ ] Content filtering works
- [ ] Content sorting works

### Content Details
- [ ] Can view content detail page
- [ ] Video playback works (if applicable)
- [ ] Image display works
- [ ] Metadata loads correctly
- [ ] Related/recommended content shows

### Creator Features
- [ ] Can access creator portal
- [ ] Can upload new content (video/image)
- [ ] Can edit existing content
- [ ] Can view content analytics
- [ ] Content processing works (thumbnail generation, etc.)

---

## Wallet & Payments

### Wallet Features
- [ ] Can view wallet balance
- [ ] Can view transaction history
- [ ] Wallet updates after purchase

### Payment Flow
- [ ] Can initiate payment via Paystack
- [ ] Can complete Paystack payment (test mode)
- [ ] Payment webhook processed correctly
- [ ] Can initiate payment via Flutterwave
- [ ] Can complete Flutterwave payment (test mode)
- [ ] Payment failure handled correctly
- [ ] Refund process works (test)
- [ ] Can purchase content with wallet

---

## Notifications

### Notification Types
- [ ] In-app notifications visible in bell
- [ ] Can mark notification as read
- [ ] Email notification sent/received (test)
- [ ] SMS notification sent/received (test)
- [ ] Push notification sent/received (test)
- [ ] Notification preferences save correctly

---

## Moderation & Admin

### Moderation
- [ ] Moderator can login to moderation portal
- [ ] Can view moderation queue
- [ ] Can approve content
- [ ] Can reject content
- [ ] Moderation actions logged

### Admin Portal
- [ ] Admin can login to admin portal
- [ ] Can view user management
- [ ] Can view content management
- [ ] Can view analytics dashboard
- [ ] Admin actions audited

---

## Performance & Stability

### Response Times
- [ ] API responses < 500ms (p50)
- [ ] API responses < 2s (p95)
- [ ] Page load time <3s (web)
- [ ] No 5xx errors (check logs)

### Caching
- [ ] Redis cache hit rate >90%
- [ ] CDN caching working
- [ ] Browser caching headers set correctly

### Error Handling
- [ ] All error states show user-friendly messages
- [ ] 404 page shows correctly
- [ ] 500 error page shows correctly
- [ ] Loading states shown
- [ ] Empty states shown

---

## Security Checks

### Transport Security
- [ ] HTTPS enforced on all pages
- [ ] HSTS header present
- [ ] No mixed content warnings
- [ ] SSL Labs A+ rating

### Authentication Security
- [ ] Passwords not visible in logs
- [ ] JWT tokens not in logs (only first/last few chars if needed)
- [ ] CSRF tokens valid (if applicable)
- [ ] Rate limiting works

---

## Cross-Device & Cross-Browser

### Browsers
- [ ] Chrome (latest) works correctly
- [ ] Firefox (latest) works correctly
- [ ] Safari (latest) works correctly
- [ ] Edge (latest) works correctly

### Devices
- [ ] Desktop (1920x1080) looks good
- [ ] Tablet (iPad/Android) looks good
- [ ] Mobile (iPhone/Android) looks good

---

## Post-Test Cleanup
- [ ] Test users deleted or marked as test
- [ ] Test payments voided/refunded
- [ ] Test content removed
- [ ] No test data left in production
- [ ] Monitoring baselined

---

## Sign-Off
| Role | Name | Signature | Date | Smoke Tests Pass |
|------|------|-----------|------|-----------------|
| QA Lead | | | | |
| Engineering Lead | | | | |
| Product Manager | | | | |
| DevOps Lead | | | | |

