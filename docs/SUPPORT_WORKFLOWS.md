# Azeebo+ Support and Admin Operations Workflows

This document outlines standard operating procedures for the support and admin teams.

---

## User Suspension

### Step-by-Step Workflow

1. **Trigger Event**:
   - User reports violations
   - Moderation flags content
   - System detects fraud patterns
   - Chargeback received

2. **Assessment**:
   - Review user activity history
   - Check previous warnings/suspensions
   - Verify evidence
   - Consult moderation team if needed

3. **Action Options**:
   - **Warning**: Email warning with clear violation details
   - **Temporary Suspension**: 24h, 72h, or 7 days
   - **Permanent Suspension**: For severe/repeat violations

4. **Execution**:
   - Admin logs into admin dashboard
   - Navigates to User Management → User Profile
   - Updates user status to `suspended`
   - Sets suspension end date (if temporary)
   - Adds reason notes to admin audit log
   - Sends automated email notification to user

5. **Audit Log Entry**:
   ```
   Action: USER_SUSPENSION
   User ID: [uuid]
   Reason: [violation details]
   Duration: [permanent / 7 days]
   Admin ID: [admin uuid]
   Timestamp: [ISO 8601]
   ```

6. **Appeal Process**:
   - User can submit appeal via support portal
   - Appeal reviewed within 48 hours
   - If approved, restore access and send confirmation

---

## Refund Handling

### Eligibility Criteria

- Digital content not accessed/watched
- Within 7 days of purchase
- Technical issues preventing access
- Fraudulent transaction confirmed

### Workflow

1. **Refund Request Received**:
   - Via support ticket, email, or in-app form
   - Collect: user ID, transaction ID, reason, proof if needed

2. **Verification**:
   - Look up transaction in PaymentIntent table
   - Verify purchase date, amount, and access status
   - Check if within refund window
   - Confirm content hasn't been accessed (check watch history)

3. **Decision**:
   - **Approved**: Process full or partial refund
   - **Denied**: Provide clear reason to user

4. **Processing (Approved)**:
   - Admin initiates refund via payment provider dashboard
   - Or trigger via admin API endpoint: `POST /api/v1/admin/payments/:id/refund`
   - Record refund in Refund table with idempotency key
   - Create wallet transaction reversing the credit
   - Send confirmation email to user

5. **Post-Refund Actions**:
   - Revoke access to purchased content
   - Log in admin audit trail
   - Update analytics for refund metrics

6. **Audit Log Entry**:
   ```
   Action: REFUND_PROCESSED
   Payment Intent ID: [uuid]
   User ID: [uuid]
   Amount: [decimal]
   Reason: [user request / technical issue / fraud]
   Admin ID: [admin uuid]
   Timestamp: [ISO 8601]
   ```

---

## Chargeback Handling

### Workflow

1. **Chargeback Received**:
   - Payment provider webhook triggers
   - System creates `Chargeback` record automatically
   - Admin notified via Slack/email alert

2. **Initial Review (24h)**:
   - Verify transaction legitimacy
   - Check user activity for fraud signs
   - Gather evidence: proof of delivery, terms acceptance, etc.

3. **Response Decision**:
   - **Accept**: If low-value or weak evidence
   - **Contest**: If we have strong proof of legitimate service

4. **Contest Submission**:
   - Upload evidence to payment provider portal
   - Include: delivery confirmation, user communications, terms acceptance, access logs
   - Submit before provider deadline (typically 7-14 days)

5. **System Actions**:
   - Immediately suspend user account
   - Reverse wallet credit
   - Create audit log entry
   - Flag user for future monitoring

6. **Outcome Tracking**:
   - Record chargeback result in system
   - Update dispute analytics
   - If won: restore user access and reverse suspension

7. **Audit Log Entry**:
   ```
   Action: CHARGEBACK_HANDLED
   Payment Intent ID: [uuid]
   User ID: [uuid]
   Amount: [decimal]
   Outcome: [accepted / won / lost]
   Admin ID: [admin uuid]
   Timestamp: [ISO 8601]
   ```

---

## Content Takedown

### Workflow

1. **Takedown Request**:
   - Copyright claim
   - Policy violation report
   - Court order/legal request

2. **Assessment**:
   - Verify claim validity
   - Review content against community guidelines
   - Check for counter-notification possibility

3. **Immediate Action (High Priority)**:
   - For illegal content or valid DMCA claims:
     - Set content status to `taken_down`
     - Remove from search and recommendations
     - Notify content creator via email

4. **Documentation**:
   - Store takedown request in AdminAuditLog
   - Keep copies of legal notices for compliance
   - Record who approved the takedown

5. **Creator Communication**:
   - Provide clear reason for takedown
   - Explain appeal process if applicable
   - Give timeline for appeal review

6. **Audit Log Entry**:
   ```
   Action: CONTENT_TAKEDOWN
   Content ID: [uuid]
   Creator ID: [uuid]
   Reason: [DMCA / policy violation / legal order]
   Request Source: [user report / legal notice / automated]
   Admin ID: [admin uuid]
   Timestamp: [ISO 8601]
   ```

7. **Counter-Notification**:
   - If creator submits valid counter-notification:
     - Review within 10 business days
     - Restore content if counter-notification valid
     - Notify claimant of counter-notification

---

## Creator Verification

### Workflow

1. **Creator Applies**:
   - User submits verification request via app
   - Provides: legal name, ID photo, payment info, social links

2. **Document Verification**:
   - Admin reviews uploaded ID
   - Verify photo matches user profile
   - Check for document tampering signs

3. **Identity Confirmation**:
   - Optional: video call for high-value creators
   - Verify payment account ownership
   - Check social media presence

4. **Decision**:
   - **Approved**:
     - Update user role to `creator`
     - Enable creator tools and payout features
     - Send welcome email with creator guide
   - **Denied**:
     - Provide reason and instructions for reapplication

5. **Audit Log Entry**:
   ```
   Action: CREATOR_VERIFICATION
   User ID: [uuid]
   Outcome: [approved / denied]
   Admin ID: [admin uuid]
   Timestamp: [ISO 8601]
   Notes: [any relevant details]
   ```

---

## Payout Review

### Workflow

1. **Payout Batch Generated**:
   - System automatically generates payout batches weekly
   - Admin notified when batch is ready for review

2. **Pre-Approval Checks**:
   - Verify creator earnings calculations
   - Check for suspicious/patterned activity
   - Confirm compliance with payout minimums ($10 threshold)
   - Review for duplicate or fraudulent transactions

3. **Hold/Flag Rules**:
   - First payout: hold for 14 days for fraud check
   - Unusual spike in earnings: flag for manual review
   - Account flagged previously: hold pending review

4. **Approval**:
   - Admin reviews and approves batch
   - Or flags individual payouts for further review

5. **Execution**:
   - Initiate transfers via payment provider API
   - Record payout transactions in Payout table
   - Send email notifications to creators
   - Log all actions in audit trail

6. **Failure Handling**:
   - Track failed payouts
   - Notify creators to update payment info
   - Retry after info updated

7. **Audit Log Entry**:
   ```
   Action: PAYOUT_BATCH_APPROVED
   Batch ID: [uuid]
   Total Creators: [number]
   Total Amount: [decimal]
   Admin ID: [admin uuid]
   Timestamp: [ISO 8601]
   ```

---

## Incident Notes

### Creating an Incident Note

1. **Incident Detected**:
   - System outage
   - Security breach
   - Data corruption
   - Payment processing failure
   - Large-scale user impact

2. **Immediate Documentation**:
   - Create incident note in admin dashboard
   - Include: timestamp, impact scope, initial assessment
   - Assign incident lead

3. **Real-Time Updates**:
   - Update note every 30 minutes during active incident
   - Record actions taken, findings, next steps
   - Communicate status to stakeholders

4. **Post-Incident Review**:
   - After resolution, add root cause analysis
   - Document lessons learned
   - Create action items for prevention
   - Schedule review meeting within 5 business days

5. **Incident Note Template**:
   ```
   # Incident: [Brief Title]
   Date: [ISO 8601]
   Severity: [SEV-1 / SEV-2 / SEV-3]
   Status: [Active / Monitoring / Resolved]
   
   ## Summary
   [What happened, impact]
   
   ## Timeline
   - [Time]: Detection
   - [Time]: Response began
   - [Time]: Action taken
   
   ## Root Cause
   [Technical explanation]
   
   ## Resolution
   [Steps taken to fix]
   
   ## Action Items
   - [ ] Preventive measure 1
   - [ ] Preventive measure 2
   
   ## Notes
   [Additional context]
   ```

---

## Manual Ledger Adjustments

### When to Use

- Payment provider reconciliation discrepancies
- System bugs causing incorrect balances
- Refunds processed offline
- Special promotions requiring manual credits

### Workflow

1. **Adjustment Request**:
   - Document reason with supporting evidence
   - Get approval from senior admin (for amounts > $100)

2. **Execution**:
   - Use admin endpoint: `POST /api/v1/admin/wallets/:userId/adjust`
   - Required:
     - `amount`: positive (credit) or negative (debit)
     - `reason`: clear explanation
     - `referenceId`: link to ticket/incident
     - `idempotencyKey`: unique key to prevent duplicates

3. **Transaction Requirements**:
   - Must be wrapped in database transaction
   - Must create corresponding WalletTransaction record
   - Must log to AdminAuditLog

4. **Audit Log Entry**:
   ```
   Action: WALLET_ADJUSTMENT
   Wallet ID: [uuid]
   User ID: [uuid]
   Amount: [decimal] (positive = credit, negative = debit)
   Reason: [detailed explanation]
   Reference: [ticket ID / incident ID]
   Approver ID: [admin uuid]
   Executor ID: [admin uuid]
   Timestamp: [ISO 8601]
   ```

5. **Notification**:
   - Send email to user explaining adjustment
   - Show adjustment in user's transaction history with label "Admin Adjustment"

---

## Approval Matrix

| Action | Threshold | Approver Required |
|--------|-----------|------------------|
| User warning | Any | Any admin |
| User suspension (temp <7d) | Any | Any admin |
| User suspension (perm) | Any | Senior admin |
| Refund | < $50 | Any admin |
| Refund | ≥ $50 | Senior admin |
| Chargeback contest | Any | Senior admin |
| Content takedown | Any | Any admin |
| Creator verification | Any | Any admin |
| Payout batch | Any | Senior admin |
| Wallet adjustment | < $100 | Any admin |
| Wallet adjustment | ≥ $100 | Senior admin |

---

## Escalation Path

1. **Level 1**: Frontline support handles routine requests
2. **Level 2**: Senior support handles complex/edge cases
3. **Level 3**: Admin team handles policy/security decisions
4. **Executive**: CTO/CEO for high-impact or legal matters

---

## Tools & Access

| Role | Tools | Access Level |
|------|-------|--------------|
| Support | Zendesk, Admin Dashboard (read-only + basic actions) | L1/L2 |
| Admin | Admin Dashboard, Payment Provider Portals, Database (read + write) | L3 |
| Senior Admin | Full admin + payment approval + user deletion | Full |

---

Last Updated: 2025
