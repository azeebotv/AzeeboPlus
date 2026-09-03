# Manual Testing Checklist — Azeebo+

Use this checklist before each release to ensure quality.

---

## 1. Authentication Flow

- [ ] Email/password registration works
- [ ] Email verification link sent
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials shows error
- [ ] Password reset flow works
- [ ] Social login (Google) works
- [ ] Social login (Apple) works
- [ ] Logout clears session
- [ ] Token refresh works automatically
- [ ] Rate limiting on login (5 attempts)

## 2. Homepage

- [ ] Hero carousel loads and auto-plays
- [ ] Hero navigation arrows work
- [ ] Trending section loads content
- [ ] Continue Watching section shows progress
- [ ] Recently Watched section loads
- [ ] New Releases section loads
- [ ] Content cards display correctly
- [ ] Content cards are clickable
- [ ] Infinite scroll works
- [ ] Loading skeletons show while loading

## 3. Content Browsing

- [ ] Universe filter works (Movies, Music, Comedy, etc.)
- [ ] Search returns relevant results
- [ ] Search autocomplete works
- [ ] Content detail page loads
- [ ] Video player loads and plays
- [ ] Video controls work (play/pause, seek, volume)
- [ ] Subtitles/captions toggle works
- [ ] Quality selection works
- [ ] Fullscreen mode works
- [ ] Related content shows

## 4. User Profile

- [ ] Profile page loads with correct data
- [ ] Edit profile works
- [ ] Avatar upload works
- [ ] Avatar crop/zoom works
- [ ] Profile settings save correctly
- [ ] Notification preferences save
- [ ] Privacy settings save
- [ ] Language preference saves
- [ ] Theme preference saves (dark/light)

## 5. Wallet & Payments

- [ ] Wallet balance displays correctly
- [ ] Transaction history loads
- [ ] Fund wallet flow works
- [ ] Payment method selection works
- [ ] Payment confirmation shows
- [ ] Transaction receipt downloads
- [ ] Wallet balance updates after payment
- [ ] Currency conversion works (NGN)

## 6. Subscriptions

- [ ] Subscription plans display correctly
- [ ] Plan comparison works
- [ ] Subscribe to plan works
- [ ] Payment processing works
- [ ] Subscription status updates
- [ ] Cancel subscription works
- [ ] Subscription renewal reminder shows

## 7. Creator Features

- [ ] Creator dashboard loads
- [ ] Analytics overview shows data
- [ ] Earnings page loads
- [ ] Content upload works
- [ ] Content edit works
- [ ] Content delete works
- [ ] Channel settings save
- [ ] Withdrawal request works

## 8. Messaging

- [ ] Conversation list loads
- [ ] New conversation starts
- [ ] Messages send successfully
- [ ] Messages receive in real-time
- [ ] Typing indicator shows
- [ ] Read receipts work
- [ ] Message reactions work
- [ ] Message search works
- [ ] Conversation mute works
- [ ] Conversation archive works

## 9. Notifications

- [ ] Notification list loads
- [ ] Notifications mark as read
- [ ] Notification click navigates
- [ ] Push notifications arrive
- [ ] Notification preferences work
- [ ] Notification badge count accurate

## 10. Offline Mode

- [ ] Offline indicator shows when disconnected
- [ ] Cached content accessible offline
- [ ] Offline queue works for actions
- [ ] Sync works when back online
- [ ] Service worker registers

## 11. Accessibility

- [ ] Tab navigation works throughout
- [ ] Screen reader announces elements
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Alt text on images
- [ ] Form labels associated
- [ ] Error messages announced
- [ ] Skip navigation link works

## 12. Responsive Design

### Mobile (375px)
- [ ] Header collapses correctly
- [ ] Navigation menu works
- [ ] Content cards stack properly
- [ ] Video player responsive
- [ ] Forms usable on mobile
- [ ] Touch targets adequate (44px)
- [ ] No horizontal scroll

### Tablet (768px)
- [ ] Layout adapts correctly
- [ ] Navigation accessible
- [ ] Content grid adjusts
- [ ] Video player scales

### Desktop (1280px)
- [ ] Full layout displays
- [ ] Sidebar navigation works
- [ ] Multi-column layouts work
- [ ] Hover states work

## 13. Performance

- [ ] Page load < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Largest Contentful Paint < 2.5 seconds
- [ ] Cumulative Layout Shift < 0.1
- [ ] No console errors
- [ ] No network failures
- [ ] Images lazy load correctly
- [ ] Animations smooth (60fps)

## 14. Security

- [ ] No sensitive data in URL
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] CSP headers present
- [ ] XSS protection works
- [ ] CSRF protection works
- [ ] Rate limiting works
- [ ] Input validation works

## 15. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Android Chrome

---

## Sign-off

| Tester | Date | Version | Status |
|--------|------|---------|--------|
| | | | Pass / Fail |

**Notes:**
