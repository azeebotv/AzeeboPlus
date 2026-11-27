# Surface Route Inventory & Screen Specification Framework

> **Identifier:** AZP-ROUTE-SPEC-001  
> **Status:** Authority Route Specification  
> **Version:** 1.0  
> **Date:** 2026-09-28  
> **Scope:** Canonical route map, release status, user journeys, and component specifications across Admin, Creator, Web, Mobile, and TV.

---

## 1. Overview

This document provides a single source of truth for all routes across the five Azeebo+ surfaces, categorizing their release scope, access control, and design specification standards:
- Resolves **DS-10-03**: Route inventory and screen-spec template.
- Resolves **ADM-10-01**: Admin critical jobs, roles, and operational specs.
- Resolves **CRE-10-02**: Creator Lite workflow specifications.
- Resolves **WEB-10-01**: Consumer Web guest and member journeys.
- Resolves **MOB-10-05**: Mobile founding journeys and universe gating.
- Resolves **TV-10-02**: TV 10-foot remote interaction specifications.

---

## 2. Common Screen Specification Template

Every screen specification in the Azeebo+ suite follows this standardized schema:

```markdown
### Screen: [Screen Name]
- **Route Path:** `[URL path or Expo route]`
- **Surface:** Web | Mobile | Admin | Creator | TV
- **Primary Persona:** Guest | Member | Creator | Operator | SuperAdmin
- **Release Status:** Approved (Founding MVP) | Gated (Feature Flag) | Deferred (Post-MVP)
- **Security / RBAC:** Public | Authenticated | Creator Role | Admin Role (`[Specific Permission]`)
- **Required Backend APIs:** `[Endpoint list]`
- **Interaction Contract:**
  - *Layout & Hierarchy:* [Primary focus, grid / rail structure, responsive breakpoints]
  - *Navigation & Focus Order:* [Tab / D-pad sequence, back navigation behavior]
  - *State Matrix:*
    - Loading: [Skeleton / Spinner implementation]
    - Success (Data): [Primary content presentation]
    - Success (Empty): [Helpful empty state copy and next action]
    - Error (Retryable): [Honest error boundary and retry mechanism]
    - Gated / Unauthorized: [Auth prompt or entitlement upgrade]
  - *Accessibility (a11y):* [ARIA roles, labels, contrast compliance, minimum 44px touch targets]
  - *Telemetry Events:* [Canonical snake_case event names emitted]
```

---

## 3. Surface Route Inventories & Specifications

### 3.1 Admin Surface (`apps/admin`)

| Route Path | Screen / Module | Status | Role Required | Key Backend Endpoints |
|---|---|---|---|---|
| `/` | Dashboard Overview | Approved | `admin:view` | `GET /admin/dashboard` |
| `/creators` | Creator Management | Approved | `admin:creators:read` | `GET /admin/creators`, `POST /admin/creators/:id/verify` |
| `/financial` | Financial & Payouts | Approved | `admin:finance:read` | `GET /admin/dashboard/revenue`, `GET /admin/payouts` |
| `/content` | Content Moderation | Approved | `admin:content:review` | `GET /admin/content/pending`, `POST /admin/content/:id/status` |
| `/feature-flags` | Feature Flag Engine | Approved | `admin:flags:write` | `GET /admin/feature-flags`, `PUT /admin/feature-flags/:key` |
| `/reality` | Reality Ops & Voting | Gated | `admin:reality:ops` | Gated behind `reality_voting_enabled` |
| `/audit` | Audit & Security Logs | Approved | `admin:audit:read` | `GET /admin/audit-logs` |

#### Operational Safeguards (ADM-10-01, ADM-10-04)
- **Feature Flags Authoring:** Toggles in `/feature-flags` control client UI gating and rollout cohorts. Crucially, client flags **do not replace server-side RBAC**.
- **Financial Actions:** Approving or rejecting creator payouts requires dual-confirmation modal with mandatory audit reason logging.
- **Error Transparency:** Financial dashboards and creator lists expose distinct error states; failed network queries never render fabricated zero totals.

---

### 3.2 Creator Surface (`apps/creator`)

| Route Path | Screen / Module | Status | Access Level | Description |
|---|---|---|---|---|
| `/` | Creator Dashboard | Approved | Authenticated Creator | Overview of views, engagement, and content status |
| `/content` | Content Library | Approved | Authenticated Creator | List of uploads (draft, review, published) |
| `/content/upload` | Upload & Submission | Approved | Authenticated Creator | Video/Image upload with metadata, tags, universe |
| `/settings` | Creator Settings | Approved | Authenticated Creator | Notification preferences, supported payout methods |
| `/payouts` | Payout Requests | Gated | Creator Lite | Cash payouts deferred per Founding MVP PRD §5 |
| `/monetization` | Monetization Matrix | Gated | Creator Lite | Advanced subscription tiers gated |

#### Creator Lite Workflows (CRE-10-02, CRE-10-03)
- **Upload Lifecycle:** Transitions through `Draft` → `Processing` → `Published`. If publish fails post-upload, draft is preserved with transparent notice.
- **Settings Safety:** Settings form blocks saves during initial query load or failure to prevent overwriting saved preferences with defaults. All switches implement WCAG ARIA semantics.

---

### 3.3 Consumer Web Surface (`apps/web`)

| Route Path | Screen Name | Status | Access Level | User Journey |
|---|---|---|---|---|
| `/` | Home Landing | Approved | Public | Hero banner, trending rails, universe discovery |
| `/explore` | Explore Universes | Approved | Public | Universe tiles (AOU, Reality, Lifestyle, etc.) |
| `/search` | Universal Search | Approved | Public | Fuzzy search, categories, duration filters, suggestions |
| `/watch/[id]` | Video Player | Approved | Public / Entitlement | Adaptive HLS player, episode carousel, recommendations |
| `/profile` | User Profile | Approved | Authenticated | Watch history, saved watchlist, account settings |
| `/login` | Authentication | Approved | Public | Phone/Email OTP authentication flow |

#### Consumer Web Journeys (WEB-10-01, WEB-10-02)
- **Search Experience:** Full typo tolerance via `/v1/search`. Network and service errors render a distinct retry card preserving the active query, preventing confusion with empty results.
- **Guest to Member Gate:** Video preview is accessible to guests; interacting with watchlist, likes, or resume progress triggers an authentication modal returning directly to playback upon sign-in.

---

### 3.4 Mobile Surface (`apps/mobile`)

| Route Path | Screen Name | Status | Interaction Model | Notes |
|---|---|---|---|---|
| `app/(tabs)/index.tsx` | Home Feed | Approved | Touch / Scroll | Hero carousel, continue watching, rails |
| `app/(tabs)/watch.tsx` | Watch Feed | Approved | Touch / Scroll | Full-bleed video discovery with real artwork thumbnails |
| `app/(tabs)/search.tsx` | Search Screen | Approved | Touch / Filter Chips | Universe filter chips, typo-tolerant search, error retry |
| `app/(tabs)/create.tsx` | Content Creation | Approved | Touch / Picker | Multi-format upload with honest draft/publish feedback |
| `app/(tabs)/profile.tsx` | User Profile | Approved | Touch / Settings | Account details, offline downloads, preferences |
| `app/(reality)/episode.tsx` | Reality Episode | Gated | Touch / Voting | Voting strictly gated by `reality_voting_enabled` flag |

---

### 3.5 TV 10-Foot Surface (`apps/tv`)

| Route Path | Screen Name | Status | Interaction Model | Notes |
|---|---|---|---|---|
| `app/index.tsx` | TV Home Rails | Approved | D-pad / Remote Focus | Horizontal content rails with high-contrast focus rings |
| `app/search.tsx` | TV Search | Approved | On-screen Keyboard | Grid results with remote focus handling |
| `app/watch/[contentId].tsx` | TV Player | Approved | Remote Transport | D-pad Play/Pause/Seek with 10-foot OSD overlay |
| `app/signin.tsx` | Device Link Auth | Approved | QR / 6-digit Code | Second-screen phone pairing for safe TV sign-in |
| `app/settings.tsx` | TV Settings | Approved | D-pad List | Resolution preferences, audio tracks, about |

---

## 4. Telemetry & Analytics Taxonomy (DS-10-06)

All five surfaces emit canonical `snake_case` events conforming to `docs/product/analytics/events.md`:
- `content_search_started`: `{ query, surface, filters }`
- `content_search_result_viewed`: `{ query, result_count, surface }`
- `content_search_failed`: `{ query, error_message, surface }`
- `video_playback_started`: `{ content_id, title, duration, quality }`
- `video_playback_completed`: `{ content_id, watch_time_seconds }`
- `content_upload_submitted`: `{ type, universe, has_file }`
- `content_published_status`: `{ content_id, status: 'published' | 'draft_saved' | 'failed' }`
