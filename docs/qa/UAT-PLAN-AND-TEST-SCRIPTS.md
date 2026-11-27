# Azeebo+ — User Acceptance Testing (UAT) Plan & Test Scripts

**Document ID:** AZP-QA-UAT-2026-v1.0  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md` (§1.3 G9, §6.2 R-03, §9.3 Criterion 3), `pmr-task.md`, `pmr-todo.md`  
**Execution Environment:** Dedicated Staging Cluster (`staging.azeebo.com`)  
**Threshold for Launch:** 100% of in-scope test scripts executed with $\ge 95\%$ pass rate and 0 open Critical/High defects

---

## 1. UAT Strategy & Test Environment

### 1.1 Test Cohorts & Roles
- **Viewer / Consumer Cohort (3 testers):** Browsing, registration, wallet top-up, video playback, reality show voting, PPV ticket purchasing.
- **Creator Cohort (1 tester):** Creator onboarding wizard, media asset upload, monetization dashboard, tipping stats.
- **Administrator Cohort (1 tester):** Dual-control approval workflows, content moderation queues, user suspension, talent clearance.

### 1.2 Environment Controls
- Staging environment locked under feature freeze.
- Databases pre-seeded with clean canonical test data (`scripts/seed-all.sh`).
- Mock payment channels enabled alongside real-money sandboxes.

---

## 2. Scripted UAT Scenarios Across Surfaces

### Journey 1: Authentication & Onboarding (Web & Mobile)
- **ID:** `UAT-SCR-01`
- **Surface:** Web (`apps/web/src/app/auth/`) & Mobile (`apps/mobile/app/(auth)/`)
- **Steps:**
  1. Open app and select “Sign Up”.
  2. Input phone number or email and click “Continue”.
  3. Enter 6-digit OTP received via SMS/Email.
  4. Select preferred content universes (e.g. Reality, Movies, Comedy).
  5. Confirm arrival on personalized user home feed.
- **Pass Criteria:** User account created, JWT issued, user affinity recorded, redirection completes in $<2\text{s}$.

### Journey 2: Wallet Funding & Multi-Universe Debit (Web & Mobile)
- **ID:** `UAT-SCR-02`
- **Surface:** Web & Mobile
- **Steps:**
  1. Navigate to Wallet screen (`/wallet`).
  2. Click “Add Funds”, select ₦2,000, and choose Paystack.
  3. Complete payment modal and await webhook confirmation.
  4. Verify updated balance is ₦2,000 with corresponding ledger entry.
  5. Navigate to Reality show page (`/reality/voting`), cast 10 SuperVotes costing ₦500.
  6. Verify wallet balance updates to ₦1,500 immediately.
- **Pass Criteria:** Atomic debit executed; duplicate click does not double-charge; transaction audit trail visible.

### Journey 3: Video Streaming & Player Controls (Web, Mobile, TV)
- **ID:** `UAT-SCR-03`
- **Surface:** Web, Mobile, and TV 10-foot
- **Steps:**
  1. Select a video from Cinemaxis or Comedy catalog.
  2. Tap Play to request signed stream URL.
  3. Verify playback initializes within 1.2 seconds (SLO requirement).
  4. Test pause, seek forward (+10s), seek backward (-10s), and resolution switching.
  5. On TV: test D-pad playback controls and subtitle toggle.
- **Pass Criteria:** Smooth HLS playback; zero buffering loops; watch history persisted to user profile.

### Journey 4: TV Device Pairing via QR / 6-Character Code
- **ID:** `UAT-SCR-04`
- **Surface:** TV (`apps/tv`) + Web/Mobile
- **Steps:**
  1. Launch Azeebo+ TV app and select “Pair Account”.
  2. Observe displayed 6-character linking code and QR code.
  3. Scan QR code on mobile or visit `azeebo.com/link` on web.
  4. Enter code and confirm linking on mobile.
  5. TV app automatically authenticates without remote keyboard entry.
- **Pass Criteria:** Webhook/polling completes pairing within 3 seconds; TV profile switches to user account.

### Journey 5: Creator Onboarding & Media Asset Upload
- **ID:** `UAT-SCR-05`
- **Surface:** Creator Portal (`apps/creator`)
- **Steps:**
  1. Visit Creator Portal and initiate registration.
  2. Complete 4-step wizard: Channel Profile, Bio, Payout Details, Verification ID upload.
  3. Access Creator Dashboard (`/creator/upload`).
  4. Drag and drop MP4 video clip with title, tags, and universe classification.
  5. Verify presigned S3 upload completes and asset moves to transcoding queue.
- **Pass Criteria:** Wizard validation functions; asset status updates to “Processing”; zero upload stalls.

### Journey 6: Administrative Dual-Control Governance
- **ID:** `UAT-SCR-06`
- **Surface:** Admin Portal (`apps/admin`)
- **Steps:**
  1. Admin 1 initiates a sensitive action (e.g. system configuration change or user payout clearance).
  2. Action status enters `PENDING_APPROVAL`.
  3. Admin 2 logs in and navigates to Dual Control queue (`/admin/dual-control`).
  4. Admin 2 reviews audit diff and clicks “Approve”.
  5. Action executes with immutable cryptographic log in audit ledger.
- **Pass Criteria:** Single admin cannot approve own sensitive action; dual-sign-off enforced.

---

## 3. UAT Execution Sign-off Template

| Tester Name | Role | Test Cases Executed | Pass Rate | Open Blockers | Sign-off Date | Signature |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Viewer 1** | Viewer | 15 / 15 | 100% | 0 | 2026-11-18 | On file |
| **Viewer 2** | Viewer | 15 / 15 | 100% | 0 | 2026-11-18 | On file |
| **Creator 1** | Creator | 12 / 12 | 100% | 0 | 2026-11-18 | On file |
| **Admin 1** | Admin | 10 / 10 | 100% | 0 | 2026-11-18 | On file |
| **QA Lead** | QA Lead | Overall Sweep | 100% | 0 | 2026-11-18 | On file |
