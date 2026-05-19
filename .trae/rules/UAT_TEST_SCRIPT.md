# Azeebo+ User Acceptance Testing (UAT) Script

## Test Environment
- **Environment:** Staging
- **Web App:** https://staging.azeebo.com
- **API:** https://staging-api.azeebo.com
- **Mobile App:** Expo Go or TestFlight build
- **Payment Mode:** Test/Sandbox only

## Test User Credentials
| Role | Email | Password |
|------|-------|----------|
| Regular User | test.user@azeebo.com | TestPass123! |
| Creator | test.creator@azeebo.com | TestPass123! |
| Moderator | test.moderator@azeebo.com | TestPass123! |
| Admin | test.admin@azeebo.com | TestPass123! |

---

## Test Session 1: New User Onboarding

**Tester:** _________________ | **Date:** _______________ | **Pass/Fail:** _________

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|--------------|-----------|
| 1 | Navigate to https://staging.azeebo.com | Home page loads successfully | | |
| 2 | Click "Sign Up" button | Registration form displayed | | |
| 3 | Enter: Name=Test User, Email=test+uat@azeebo.com, Password=TestPass123! | Form accepts input | | |
| 4 | Click "Create Account" | Account created, verification email sent | | |
| 5 | (If email testing available) Click verification link | Email verified, redirected to login | | |
| 6 | Login with new credentials | Successful login, home page loads | | |
| 7 | Click profile icon, select "Edit Profile" | Profile edit page loads | | |
| 8 | Update display name and bio, save | Changes saved and visible | | |
| 9 | Upload a profile picture | Image uploaded and displayed | | |
| 10 | Log out | Successfully logged out | | |

**Notes:** _____________________________________________________________

---

## Test Session 2: Content Browsing & Search

**Tester:** _________________ | **Date:** _______________ | **Pass/Fail:** _________

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|--------------|-----------|
| 1 | Login as regular user | Home page loads with content feed | | |
| 2 | Scroll through feed | Infinite scroll loads more content | | |
| 3 | Click on a content item | Content detail page loads | | |
| 4 | Watch/View content (video/image) | Media plays/displays correctly | | |
| 5 | Go back to feed, click "Search" | Search page opens | | |
| 6 | Search for a term | Relevant results returned | | |
| 7 | Apply filters (universe, content type) | Results filtered correctly | | |
| 8 | Navigate to "Reality" universe | Reality-specific content loads | | |
| 9 | Navigate to "Games" universe | Games content and leaderboards load | | |
| 10 | Navigate to "Sports" universe | Sports predictions interface loads | | |

**Notes:** _____________________________________________________________

---

## Test Session 3: Wallet & Payments

**Tester:** _________________ | **Date:** _______________ | **Pass/Fail:** _________

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|--------------|-----------|
| 1 | Login, click "Wallet" | Wallet page loads with balance | | |
| 2 | Click "Top Up" | Top up page opens | | |
| 3 | Select Paystack, enter amount=1000 | Payment screen loads | | |
| 4 | Complete test payment | Payment successful, balance increases | | |
| 5 | View transaction history | New transaction listed | | |
| 6 | Find premium content, click "Purchase" | Purchase modal opens | | |
| 7 | Confirm purchase | Balance deducted, content accessible | | |
| 8 | Click "Wallet" again | New transaction in history | | |
| 9 | (If applicable) Apply promo code | Promo balance added | | |

**Notes:** _____________________________________________________________

---

## Test Session 4: Creator Workflow

**Tester:** _________________ | **Date:** _______________ | **Pass/Fail:** _________

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|--------------|-----------|
| 1 | Login as test.creator@azeebo.com | Creator dashboard loads | | |
| 2 | Click "Upload Content" | Upload page opens | | |
| 3 | Select content type (video/image), add title/description | Form accepts input | | |
| 4 | Select universe, upload media file | Upload begins, progress shown | | |
| 5 | Wait for processing to complete | Content uploaded successfully | | |
| 6 | View content in "My Content" | New content listed | | |
| 7 | Click edit on content, make changes | Changes saved | | |
| 8 | View content analytics | Views, engagement stats displayed | | |

**Notes:** _____________________________________________________________

---

## Test Session 5: Moderation Workflow

**Tester:** _________________ | **Date:** _______________ | **Pass/Fail:** _________

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|--------------|-----------|
| 1 | Login as test.moderator@azeebo.com | Moderation dashboard loads | | |
| 2 | View moderation queue | Flagged content listed | | |
| 3 | Click on a flagged content item | Content details and flags displayed | | |
| 4 | Review content and click "Approve" | Content status updated, removed from queue | | |
| 5 | Find another flagged item, click "Reject" | Content rejected, removed from queue | | |
| 6 | View moderation history | Actions logged | | |

**Notes:** _____________________________________________________________

---

## Test Session 6: Notifications

**Tester:** _________________ | **Date:** _______________ | **Pass/Fail:** _________

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|--------------|-----------|
| 1 | Login as regular user | Home page loads | | |
| 2 | Click notifications icon (bell) | In-app notifications open | | |
| 3 | Perform an action that triggers notification (e.g., purchase, follow) | Notification appears in list | | |
| 4 | Click on notification | Marked as read | | |
| 5 | Go to Settings > Notifications | Notification preferences page | | |
| 6 | Toggle notification preferences | Settings saved | | |

**Notes:** _____________________________________________________________

---

## Test Session 7: Mobile App (if applicable)

**Tester:** _________________ | **Date:** _______________ | **Pass/Fail:** _________

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|--------------|-----------|
| 1 | Open mobile app | App launches, login screen | | |
| 2 | Login with test user credentials | Successful login | | |
| 3 | Browse content feed | Content loads smoothly | | |
| 4 | View content detail | Media plays correctly | | |
| 5 | Navigate to wallet | Wallet page loads | | |
| 6 | Test pull-to-refresh | Content refreshes | | |
| 7 | Test offline mode (if applicable) | App handles gracefully | | |

**Notes:** _____________________________________________________________

---

## UAT Sign-Off

| Role | Name | Signature | Date | Overall Pass/Fail |
|------|------|-----------|------|------------------|
| Product Manager | | | | |
| QA Lead | | | | |
| Beta Tester 1 | | | | |
| Beta Tester 2 | | | | |
| Beta Tester 3 | | | | |

### Final Comments:
____________________________________________________________________
____________________________________________________________________
____________________________________________________________________

