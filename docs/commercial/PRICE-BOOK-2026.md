# Azeebo+ — Official Commercial Price Book 2026

**Document ID:** AZP-COM-PB-2026-v1.0  
**Effective Date:** Q4 2026 Launch  
**Currency Primary:** Nigerian Naira (NGN, ₦)  
**Currency Secondary:** US Dollar (USD, $)  
**Companion Code Source:** `packages/shared-types/src/pricing.ts`, `packages/shared-types/src/price-book.json`  
**Classification:** Commercial & Financial Governance Baseline

---

## 1. Executive Summary

This Price Book specifies the authoritative commercial pricing structure for the Azeebo+ operating system across all nine content universes and five client surfaces. It resolves PMR governance gap **I-04** and satisfies Milestone **M3/Task 1.4**.

All services pricing subscriptions, passes, votes, rentals, and PPV access are bound to these pricing schedules.

---

## 2. Subscription Tiers (Individual Universes & All-Access)

### 2.1 Standard Universe Subscriptions (Reality, Movies, Comedy, Lifestyle, Sports, Games, Vertical)

| Tier | Monthly (NGN) | Annual (NGN) | Features & Entitlements |
| :--- | :---: | :---: | :--- |
| **Free (Ad-Supported)** | **₦0** | **₦0** | 720p streaming, 1 stream, standard catalog with pre-roll ads |
| **Basic** | **₦999** | **₦9,990** | 1080p Full HD, 2 concurrent streams, ad-free universe catalog, 5 offline downloads |
| **Premium** | **₦2,999** | **₦29,990** | 4K HDR + Dolby Atmos, 4 concurrent streams, ad-free, unlimited downloads, early access |
| **Family** | **₦4,999** | **₦49,990** | 4K HDR, 6 profiles, 6 concurrent streams, parental controls, shared wallet allowance |

---

## 3. Multi-Universe Bundle Passes

Multi-universe bundles allow cross-universe liquidity with tiered savings.

| Bundle ID | Bundle Name | Universes Included | Monthly Price (NGN) | Effective Discount |
| :--- | :--- | :--- | :---: | :---: |
| `entertainment` | **Entertainment Bundle** | Reality, Comedy, Movies | **₦2,100** | 30% vs standalone |
| `creator-pack` | **Creator Pack** | Creator, Lifestyle | **₦1,500** | 25% vs standalone |
| `sports-games` | **Sports & Games** | Sports, Games | **₦1,400** | 30% vs standalone |
| `all-access` | **All-Access Azeebo+** | All 9 Universes | **₦4,800** | 40% vs standalone |

---

## 4. Pay-Per-View (PPV) & Live Events

| Event Tier | Price (NGN) | USD Equivalent | Access Scope |
| :--- | :---: | :---: | :--- |
| **Standard Stream** | **₦1,500** | **$2.00** | Single live event stream + 48-hour replay |
| **VIP Stream** | **₦3,500** | **$4.50** | Multi-angle camera stream, backstage chat, 7-day replay |
| **All-Access Backstage** | **₦7,500** | **$10.00** | Interactive stage queue, virtual meet-and-greet token, 30-day replay |

---

## 5. Cinemaxis Theatrical & VOD Day-and-Date

| Transaction Type | Price (NGN) | Window / Duration |
| :--- | :---: | :--- |
| **Theatrical Day-and-Date Premiere** | **₦2,500** | 48-hour viewing window during theatrical release |
| **Standard Film Rental (VOD)** | **₦500** | 48-hour viewing window |
| **Digital Purchase (EST / Own)** | **₦1,500** | Permanent library entitlement |
| **Cinemaxis Monthly Theatrical Pass** | **₦4,500** | Unlimited streaming of all Cinemaxis premieres and library |

---

## 6. SuperVote & Reality Universe Voting Tokens

Standard voting is included with subscriptions. SuperVote packages allow amplified voting weight on elimination reality shows (e.g. *Survivor: Island Titans*).

| Package | Standard Votes | SuperVotes Included | Price (NGN) | Unit Price |
| :--- | :---: | :---: | :---: | :---: |
| **Starter Pack** | 100 | — | **₦100** | ₦1.00 / vote |
| **Bronze Pack** | 500 | 1 | **₦450** | ₦0.90 / vote |
| **Silver Pack** | 1,000 | 5 | **₦850** | ₦0.85 / vote |
| **Gold Pack** | 5,000 | 25 | **₦4,000** | ₦0.80 / vote |
| **SuperVote Standalone 1** | — | 1 SuperVote | **₦500** | ₦500 / vote |
| **SuperVote Pack 5** | — | 5 SuperVotes | **₦2,000** | ₦400 / vote |
| **SuperVote Pack 10** | — | 10 SuperVotes | **₦3,500** | ₦350 / vote |
| **SuperVote Pack 25** | — | 25 SuperVotes | **₦8,000** | ₦320 / vote |

---

## 7. Wallet Transaction Limits & Tipping

### 7.1 Wallet Balance & Movement Constraints

| Metric | Minimum (NGN) | Maximum (NGN) | Settlement Velocity |
| :--- | :---: | :---: | :--- |
| **Deposit / Funding** | **₦100** | **₦1,000,000** | Instant (Paystack / Flutterwave) |
| **Withdrawal to Bank** | **₦500** | **₦500,000** | 24 hours (Automated NIP) |
| **Peer-to-Peer Transfer** | **₦100** | **₦250,000** | Instant with idempotency |

### 7.2 Creator Tipping Presets

| Denomination Preset | Amount (NGN) | Creator Net (80%) | Platform Take (20%) |
| :--- | :---: | :---: | :---: |
| **Cheer** | **₦100** | ₦80 | ₦20 |
| **Applaud** | **₦200** | ₦160 | ₦40 |
| **Support** | **₦500** | ₦400 | ₦100 |
| **Superstar** | **₦1,000** | ₦800 | ₦200 |
| **Patron** | **₦5,000** | ₦4,000 | ₦1,000 |

---

## 8. Financial Governance & Anti-Fraud Controls

1. **Idempotency Mandatory:** All debit, funding, and super-vote requests require client-supplied UUIDv4 `X-Idempotency-Key`.
2. **Double-Spend Prevention:** Every mutation is executed within PostgreSQL transaction with `SELECT ... FOR UPDATE` row-level locks and Redis mutex.
3. **Auditing:** Every balance mutation produces an immutable, sequence-numbered ledger row in `wallet_service.ledger_entries`.
4. **Approval:** Co-signed by Finance Director and Lead Architect.
