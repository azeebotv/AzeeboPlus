# T-P1-004 Findings — Backend Service Audit (27 services)

**Evidence dir:** [audit-evidence/P1/services/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/services/)

---

## Coverage matrix

| Service                                       | main.ts | ValidationPipe | helmet | APP_GUARD/INTERCEPTOR/FILTER/PIPE | Controllers | Endpoints |
| --------------------------------------------- | :-----: | :------------: | :----: | :--------------------------------: | :---------: | :-------: |
| core/auth-service                             | ✅      | ✅             | ✅     | APP_GUARD                          | 8           | 34        |
| core/content-service                          | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               | 5           | 81        |
| core/media-service                            | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               | 3           | 27        |
| core/payment-service                          | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               | 5           | 18        |
| core/search-service                           | ✅      | ✅             | ✅     | **NONE**                           | 3           | 11        |
| core/user-service                             | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               | 4           | 42        |
| core/wallet-service                           | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               | 4           | 22        |
| gateway/api-gateway                           | ✅      | ✅             | ✅     | **NONE**                           | 3           | 17        |
| engagement/engagement-service                 | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| engagement/messaging-service                  | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| engagement/notification-service               | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               |             |           |
| engagement/referral-service                   | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| engagement/reward-service                     | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| engagement/subscription-service               | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| intelligence/analytics-service                | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| intelligence/recommendation-service           | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| operations/moderation-service                 | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| operations/queue-service                      | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               |             |           |
| operations/support-service                    | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| universes/comedy-service                      | ✅      | ✅             | ✅     | APP_GUARD + APP_INTERCEPTOR         |             |           |
| universes/creator-service                     | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               |             |           |
| universes/games-service                       | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               | 5           | 28        |
| universes/lifestyle-service                   | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| universes/movie-service                       | ✅      | ✅             | ✅     | **NONE**                           | 5           | 32        |
| universes/reality-service                     | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| universes/sports-service                      | ✅      | ✅             | ✅     | APP_INTERCEPTOR (×2)               |             |           |
| universes/vertical-service                    | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| apps/admin                                    | ✅      | ✅             | ✅     | **NONE**                           |             |           |
| apps/creator-portal                           | ✅      | ✅             | ✅     | **NONE**                           |             |           |

---

## P1-020 — Unauthenticated GDPR endpoints in `user-service` (Critical · security · compliance)

**File:** [services/core/user-service/src/modules/user/user-deletion.controller.ts](file:///Users/deprof/www/azeebo+/services/core/user-service/src/modules/user/user-deletion.controller.ts#L1-L60)

**Endpoints:**
- `POST /privacy/deletion-request` — request deletion of any user by UUID (no auth)
- `DELETE /privacy/data/:userId` — execute deletion (no auth)
- `GET /privacy/data/:userId/export` — export any user's data (no auth)

**RCA (6-item):**
1. **Symptom:** anyone with knowledge of the route + a target UUID can (a) schedule deletion of any user, (b) execute the deletion, (c) export every datum the system holds on that user. GDPR Articles 17 + 20 become weaponizable.
2. **Trigger:** `curl -X DELETE https://api.azeeboplus.com/privacy/data/<uuid>`.
3. **Proximate cause:** `@Controller('privacy')` with no `@UseGuards(AuthGuard('jwt'))` or `@UseGuards(ThrottlerGuard)`. `app.module.ts` registers `APP_INTERCEPTOR` only — not `APP_GUARD` — so nothing enforces authentication globally.
4. **Root cause:** GDPR endpoints were added to `user-service` but the `APP_GUARD` (which exists in `auth-service` and `comedy-service`) was not ported. The team likely relied on the API gateway to enforce auth — but `api-gateway` also has no `APP_GUARD` configured (see P1-021).
5. **Blast radius:** every user's account integrity + every user's PII. A single scripted call can wipe or exfiltrate data on every UUID.
6. **Detection gap:** no contract test for `privacy/*` routes; no Pact assertion; no DAST scan in CI.

**Remediation:**
1. Add `@UseGuards(AuthGuard('jwt'))` (or `JwtAuthGuard` from `apps/admin`) to `UserDeletionController`.
2. Inside each handler, assert `req.user.id === params.userId || req.user.role === 'admin'`.
3. Add `@Throttle({ default: { limit: 5, ttl: 60000 } })` to defeat enumeration.
4. Add an e2e test in `services/core/user-service/test/privacy.e2e-spec.ts` asserting 401 for missing token, 403 for cross-user access, 200 for owner.
5. Add an API gateway-level route policy: `services/gateway/api-gateway/src/modules/route-policy/` that maps `privacy/*` to a required scope.

---

## P1-021 — API gateway has no global guard (Critical · security)

**File:** [services/gateway/api-gateway/src/app.module.ts](file:///Users/deprof/www/azeebo+/services/gateway/api-gateway/src/app.module.ts)

**Observation:** `api-gateway` is the single ingress for all 27 services; its `app.module.ts` registers **no `APP_GUARD`, no `APP_INTERCEPTOR`, no `APP_FILTER`**. There is no central auth enforcement.

**RCA:**
1. **Symptom:** any service that forgets to add `@UseGuards` (like P1-020) is exposed to the internet.
2. **Trigger:** a service ships a new controller without local guard wiring.
3. **Proximate cause:** the gateway is a thin proxy rather than a policy enforcement point.
4. **Root cause:** no architectural decision to centralize auth in the gateway; the original design assumed each service self-policed.
5. **Blast radius:** every endpoint in every service. Defense-in-depth is absent.
6. **Detection gap:** no CI rule that rejects a service without a registered `APP_GUARD` or a `@UseGuards` on every non-health controller.

**Remediation:** In `api-gateway/src/app.module.ts`, register a global JWT guard + a public-route allowlist via a custom decorator:
```ts
import { APP_GUARD } from '@nestjs/core';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: GatewayAuthGuard },
  ],
})
export class AppModule {}
```
`GatewayAuthGuard` uses a `@Public()` decorator metadata to allow health/swagger routes through, denies everything else with 401, and forwards the validated JWT to the upstream service via header.

---

## P1-022 — `apps/admin` and `apps/creator-portal` NestJS apps have no global guard (High · security)

**Files:**
- [apps/admin/src/app.module.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/app.module.ts)
- [apps/creator-portal/src/app.module.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/app.module.ts)

**RCA:** Same shape as P1-021 but for the two NestJS-rendered admin portals. Admin endpoints (e.g. `audit/`, `financial/`, `wallets/`) are extremely sensitive. Without a global `APP_GUARD`, every new controller in `apps/admin/src/modules/**` ships unguarded unless a developer remembers `@UseGuards`.

**Remediation:** register `APP_GUARD: JwtAuthGuard` + `APP_INTERCEPTOR: AuditLogInterceptor` in `app.module.ts`; add `@Public()` for `/auth/login` only.

---

## P1-023 — 13 services with NO global guard/interceptor/filter/pipe registration (High · security · maintainability)

**Files:** see table above. Affected services:
- `core/search-service`
- `intelligence/analytics-service`
- `intelligence/recommendation-service`
- `operations/moderation-service`
- `operations/support-service`
- `engagement/engagement-service`
- `engagement/messaging-service`
- `engagement/referral-service`
- `engagement/reward-service`
- `engagement/subscription-service`
- `universes/lifestyle-service`
- `universes/movie-service`
- `universes/reality-service`
- `universes/vertical-service`

**RCA:** As P1-021, but per-service. Each is missing the global plumbing that every well-built NestJS service should ship.

**Remediation:** Standardise `app.module.ts` template; add a CI check that fails a service whose `app.module.ts` does not register `APP_GUARD` + `APP_INTERCEPTOR` + `APP_FILTER`.

---

## P1-024 — `circuit-breaker.controller.ts` exposed without guard (Medium · security · observability)

**File:** [services/gateway/api-gateway/src/modules/health/circuit-breaker.controller.ts](file:///Users/deprof/www/azeebo+/services/gateway/api-gateway/src/modules/health/circuit-breaker.controller.ts)

**RCA:** The circuit-breaker controller exposes the state of upstream breakers. If the gateway has no `APP_GUARD`, an attacker can read circuit state and infer upstream service health, plan denial-of-service attacks around known failure windows, and fingerprint internal architecture.

**Remediation:** Restrict `/health/circuit-breaker` to internal mesh only; require `X-Internal-Auth` header from the service-mesh sidecar.

---

## P1-025 — 7 `universes/*` controllers unguarded and not health-only (Medium · security)

**Files:**
- [services/universes/lifestyle-service/src/modules/music/music.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/lifestyle-service/src/modules/music/music.controller.ts)
- [services/universes/lifestyle-service/src/modules/influencer/influencer.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/lifestyle-service/src/modules/influencer/influencer.controller.ts)
- [services/universes/lifestyle-service/src/modules/celebrity/celebrity.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/lifestyle-service/src/modules/celebrity/celebrity.controller.ts)
- [services/universes/lifestyle-service/src/modules/city-guide/city-guide.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/lifestyle-service/src/modules/city-guide/city-guide.controller.ts)
- [services/universes/lifestyle-service/src/modules/social/social.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/lifestyle-service/src/modules/social/social.controller.ts)
- [services/universes/lifestyle-service/src/modules/nightlife/nightlife.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/lifestyle-service/src/modules/nightlife/nightlife.controller.ts)
- [services/universes/movie-service/src/modules/cinema-pass/cinema-pass.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/movie-service/src/modules/cinema-pass/cinema-pass.controller.ts)
- [services/universes/movie-service/src/modules/filmmaker/filmmaker.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/movie-service/src/modules/filmmaker/filmmaker.controller.ts)
- [services/universes/vertical-service/src/modules/{crossovers,lore,titles,characters,timeline}.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/vertical-service/src/modules/crossovers/crossovers.controller.ts)
- [services/universes/games-service/src/modules/game-catalog/game-catalog.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/games-service/src/modules/game-catalog/game-catalog.controller.ts)
- [services/universes/comedy-service/src/modules/comedy-feed/comedy-feed.controller.ts](file:///Users/deprof/www/azeebo+/services/universes/comedy-service/src/modules/comedy-feed/comedy-feed.controller.ts)
- [services/intelligence/recommendation-service/src/modules/recommendation/recommendation.controller.ts](file:///Users/deprof/www/azeebo+/services/intelligence/recommendation-service/src/modules/recommendation/recommendation.controller.ts)
- [services/intelligence/analytics-service/src/modules/intelligence/intelligence.controller.ts](file:///Users/deprof/www/azeebo+/services/intelligence/analytics-service/src/modules/intelligence/intelligence.controller.ts)
- [services/intelligence/analytics-service/src/modules/analytics-instrumentation/analytics-instrumentation.controller.ts](file:///Users/deprob/www/azeebo+/services/intelligence/analytics-service/src/modules/analytics-instrumentation/analytics-instrumentation.controller.ts)
- [services/operations/support-service/src/modules/ticket/ticket.controller.ts](file:///Users/deprof/www/azeebo+/services/operations/support-service/src/modules/ticket/ticket.controller.ts)
- [services/operations/support-service/src/modules/dashboard/support-dashboard.controller.ts](file:///Users/deprof/www/azeebo+/services/operations/support-service/src/modules/dashboard/support-dashboard.controller.ts)

**RCA:** These are user-facing / business-logic controllers, not health checks, but they have no `@UseGuards`. Some are public-by-design (e.g. content browse) but should still rate-limit + DDoS-protect + require auth for personalization.

**Remediation:** Decide per-controller: `@Public()` for genuinely public content; `@UseGuards(AuthGuard('jwt'))` for personalised; add `@Throttle` to all.

---

## Summary

| ID     | Sev      | Title                                                                  |
| ------ | -------- | ---------------------------------------------------------------------- |
| P1-020 | Critical | Unauthenticated GDPR endpoints in `user-service`                       |
| P1-021 | Critical | API gateway has no global guard                                         |
| P1-022 | High     | `apps/admin` and `apps/creator-portal` NestJS apps have no global guard |
| P1-023 | High     | 13 services with NO global guard/interceptor/filter/pipe               |
| P1-024 | Medium   | `circuit-breaker.controller.ts` exposed without guard                   |
| P1-025 | Medium   | 16 user-facing controllers unguarded across 8 services                 |

**Verification status:**
- [x] All 27 services covered (counted, main.ts inspected, app.module.ts inspected).
- [x] Validation pipes verified per bootstrap — all 28 present.
- [ ] Live NestJS runtime guard wiring test → **NOT SATISFIED — requires `pnpm install` + boot each service + supertest; deferred to T-V-001/V-002.**