# PRD: Google & Apple Social Login (Web Auth Page)

> **Priority:** P1 · **Est. effort:** 6 days (4 engineering, 1 QA, 1 staging verification) · **Status:** [BLOCKED] on provider credentials
> **Finding:** AUD-80 (see [audit.md](../../audit.md) §8) · **Owner:** auth-service + apps/web
> **Interim state shipped:** 2026-10-08 — the two provider buttons are `disabled` with an explanatory caption. There is no user-facing 404 today.

---

## 1. Problem Statement

The platform's login page advertises Google and Apple sign-in, but the flow is broken end to end: there is no browser entry point, no browser return point, and no route that turns a provider callback into a session. Today both buttons are deliberately disabled, so the platform under-delivers on a standard expectation for consumer apps and loses the conversion benefit of one-tap signup.

This is **not** a patch. The OAuth state machine exists only as a pair of JSON endpoints that nothing calls, and the callback target points at the auth service rather than at a page a browser can land on.

## 2. Verified Current State (checked 2026-11-05 against `Major-Upgrade`)

The October audit listed four gaps. Two are already fixed and must **not** be rebuilt. Two remain, plus three defects found in this pass.

| #   | Item                                                        | Evidence                                                                                                                                                                                                                                                                          | Status                                  |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | Gateway blocks the authorize entry when signed out          | [`gateway-auth.guard.ts:38`](../../services/gateway/api-gateway/src/guards/gateway-auth.guard.ts#L38) — `PUBLIC_PATH_PATTERNS` already matches `social/(google\|apple)(/authorize)?` and `social/callback`                                                                        | **[COMPLETED]** — no change needed      |
| 2   | Proxy registry declares authorize as POST-only              | [`proxy.controller.ts:101-118`](../../services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts#L101-L118) — now declares `GET` for both authorize routes, `POST` for callback                                                                                           | **[COMPLETED]** — no change needed      |
| 3   | Authorize returns JSON instead of a redirect                | [`social.controller.ts`](../../services/core/auth-service/src/modules/auth/social/social.controller.ts) now defaults to `302` via a shared `startAuthorization`; JSON kept behind `?format=json`                                                                                  | **[COMPLETED]** 2026-11-05              |
| 4   | No browser callback route                                   | Added [`apps/web/src/app/auth/callback/route.ts`](../../apps/web/src/app/auth/callback/route.ts) exporting `GET` (Google) **and** `POST` (Apple `form_post`); `redirect_uri` now comes from required `GOOGLE_REDIRECT_URI` / `APPLE_REDIRECT_URI` instead of a `BASE_URL` default | **[COMPLETED]** 2026-11-05              |
| 5   | Provider credentials are documented nowhere                 | `grep GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` across every `.env.example` returns zero hits, though both are read via `ConfigService`                                                                                                                                               | **[BLOCKED]** — fixed in this pass (§8) |
| 6   | Apple `client_secret` is treated as a static string         | [`AppleClientSecretService`](../../services/core/auth-service/src/modules/auth/social/apple-client-secret.service.ts) mints and caches an ES256 JWT from `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY`; `APPLE_CLIENT_SECRET` is gone                                    | **[COMPLETED]** 2026-11-05              |
| 7   | Apple error posts are rejected before the error branch runs | `SocialAuthCallbackDto.code` is now `@ValidateIf((dto) => !dto.error)`, so an `error` post without a `code` reaches the handler; every non-error callback still requires it                                                                                                       | **[COMPLETED]** 2026-11-05              |

Two further defects found while reading the service:

- **Dead redirect validation.** `buildAuthorizeUrl` validates its `redirectUri` argument against `SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS`, then never uses it — the built URL always uses `callbackUrl`. The check reads as an open-redirect defence but protects nothing.
- **Missing OIDC claim checks.** `verifyAppleToken` verified the signature but compared neither `aud` nor `iss`, so a token minted for another Apple client was accepted — **fixed 2026-11-05** (see §9.10 of `audit.md`): `iss` must be `https://appleid.apple.com` and `aud` must contain `APPLE_CLIENT_ID`, read through `AppleClientSecretService.getClientId()` so an unconfigured deployment fails closed with `503`. **Still open:** `verifyGoogleToken` does not compare `aud` to `GOOGLE_CLIENT_ID` (Google's tokeninfo endpoint verifies the token but not the requesting client).

## 3. Goals & Non-Goals

**Goals**

- A signed-out visitor can complete Google or Apple sign-in in one click plus provider consent, and land authenticated on the web app.
- The resulting session is byte-for-byte the same httpOnly cookie session that password login creates — no second-class user.
- Every failure renders a human-readable message on the login page. No raw JSON, no dead end.
- The `?redirect=` return target works for allowlisted panel origins using the existing helper, not a second implementation.

**Non-goals**

- Social login in mobile, TV, admin, or creator apps. Admin and creator use the web login page already; mobile/TV keep native SDKs and are out of scope.
- Linking/unlinking UI on the profile screen. The `POST /auth/social/unlink` endpoint exists and stays as-is; surfacing it is a separate ticket.
- Migrating the legacy `POST /auth/social/{google,apple}` endpoints. They stay for backward compatibility.
- MFA interaction for social logins. Social providers are treated as a single strong factor; document the decision in §10.

## 4. User Stories

1. **As a new visitor**, I want to sign up with Google in one click so I don't have to invent a password.
2. **As a returning user**, I want Apple sign-in to return me to the panel that sent me to the login page.
3. **As a user who cancels consent**, I want to be returned to the login form with a clear message and my typed email intact.
4. **As a platform operator**, I want a kill switch that turns a provider off end to end, including the button, so a provider outage doesn't look like a platform outage.
5. **As a security reviewer**, I want a tampered `state`, a replayed `state`, and a cross-provider `state` all rejected without revealing which check failed.

## 5. Functional Requirements

### FR-1 — Browser entry point returns a 302 `[COMPLETED]`

- `GET /api/v1/auth/social/{google,apple}/authorize` responds `302` with `Location` set to the provider URL.
- The existing JSON shape `{ state, authorizeUrl }` is preserved for non-browser callers under `?format=json`.
- Requires no session. Already public at the gateway (§2 row 1) — do not re-add.
- Returns `503` with a problem-details body when the provider's `client_id` is unset. A URL with an empty `client_id` must never be minted.

### FR-2 — A browser-reachable callback route `[COMPLETED]`

- New route `apps/web/src/app/auth/callback/page.tsx`.
- Must accept **both** shapes, because the providers differ:
  - **Google** → `GET ?code=…&state=…`
  - **Apple** → `POST` form-urlencoded `code`, `state`, `id_token`, `user` (Apple posts when `response_mode=form_post`)
- The route reads the parameters, calls the service, and then completes the session (§FR-4).
- `redirect_uri` registered with each provider must be the **web app's** callback URL, not the auth service origin. `GOOGLE_REDIRECT_URI` and `APPLE_REDIRECT_URI` become the single source of truth and must be required, not defaulted.

### FR-3 — Return target travels inside `state` `[BLOCKED]`

- The `redirect` value is stored in the server-side Redis state record, alongside the provider, and never appears in a provider-visible query parameter.
- Proposed record: `social_state:{state}` → JSON `{ provider, redirect, createdAt }`, TTL 600s (unchanged constant).
- On callback, the service resolves the stored value through the **existing** [`safeRedirectTarget`](../../apps/web/src/lib/first-party-redirect.ts) plus `NEXT_PUBLIC_PANEL_ORIGINS`. Do not write a second allowlist.
- The state record is deleted on first read (single-use). `validateState` already deletes; keep that.

### FR-4 — Cookie session parity `[BLOCKED]`

- On successful exchange, the web app `POST`s the returned tokens to `/api/v1/auth/cookie` so the httpOnly jar is set exactly as the password path does.
- Acceptance: after the redirect, `GET /api/v1/auth/me` with **cookies only** (no `Authorization` header) returns the user.
- Tokens must never be written to `localStorage` on this path.

### FR-5 — Account linking policy

- Provider identity is keyed on `(provider, sub)` — never on email alone.
- If `(provider, sub)` is already linked to a different user, reject with `409` and the message used today: "Social account already linked to another user".
- If the provider email matches an existing password account and the provider asserts the email is verified, link silently and log it. Google returns `email_verified`; Apple's `email_verified` claim must be checked explicitly before linking.
- New users are created with `role: 'user'` and a random password hash (existing behaviour).

### FR-6 — Error handling renders on the page `[BLOCKED]`

Every branch below must land on `/auth/login?error=…` with a friendly message and a preserved `redirect`. No provider error string is echoed verbatim to the user.

| Condition                                    | HTTP from service | User sees                                          |
| -------------------------------------------- | ----------------- | -------------------------------------------------- |
| User cancels consent (`error=access_denied`) | `400`             | "Sign-in was cancelled."                           |
| `state` missing, expired, or tampered        | `400`             | "This sign-in link has expired. Please try again." |
| Code exchange fails at provider              | `502`             | "Google couldn't complete the sign-in. Try again." |
| Provider unconfigured / kill-switched        | `503`             | "This sign-in method is temporarily unavailable."  |
| Social account linked elsewhere              | `409`             | "That account is already linked to another user."  |

- `SocialAuthCallbackDto.code` becomes optional **when `error` is present**, so Apple's error posts reach the handler instead of failing validation (§2 row 7). **Done 2026-11-05** — the field is `@ValidateIf((dto) => !dto.error)`, so it stays mandatory for every non-error callback; an empty-string `error` does not unlock the exception. The handler's provider-error branch now returns a fixed message instead of echoing the caller-supplied provider string, and a `!dto.code` guard covers the type narrowing.

### FR-7 — Kill switches work end to end `[COMPLETED]`

- `authFlags.socialGoogle` / `authFlags.socialApple` already guard the authorize endpoints.
- The login page must hide or disable a button when its flag is off, driven by the existing `/feature-flags/bootstrap` client contract — not by a hardcoded constant.
- Turning a flag off mid-flow must fail the callback with `503`, not a partially-authenticated session.

### FR-8 — Button states `[COMPLETED]`

- Buttons are enabled only when: the provider flag is on, and the page is not already submitting.
- On click: `disabled`, spinner, `aria-busy="true"`, label "Redirecting to Google…".
- Remove the current caption when the feature ships; it is attached to `[data-social-unavailable]` in the login page so it is trivial to scope a test to.

### FR-9 — Analytics

Per `CLAUDE.md`, conversion screens fire `view`/`submit`/`success`/`failure` with `snake_case` names:

- `auth_social_flow_started` — `{ provider, source: 'web_login' }`
- `auth_social_flow_succeeded` — `{ provider, is_new_user: boolean, duration_ms }`
- `auth_social_flow_failed` — `{ provider, reason }` where `reason` ∈ `cancelled`, `state_invalid`, `exchange_failed`, `account_conflict`, `unavailable`

## 6. Technical Design

### 6.1 Flow

```
Browser                apps/web                gateway              auth-service          Provider
   │                      │                       │                      │                    │
   │ click Google         │                       │                      │                    │
   ├─────────────────────►│  GET /auth/social/    │                      │                    │
   │                      │      google/authorize │                      │                    │
   │                      ├──────────────────────►│  proxy (public)      │                    │
   │                      │                       ├─────────────────────►│ generate state     │
   │                      │                       │                      │ (+ redirect)       │
   │  302 Location: provider authorize URL       │                      │                    │
   │◄─────────────────────┴───────────────────────┴──────────────────────┤                    │
   ├──────────────────────────────────────────────────────────────────────────────────────────►│
   │                                        consent screen                                     │
   │◄──────────────────────────────────────────────────────────────────────────────────────────┤
   │ GET ?code&state  (Google) / POST form (Apple)                                             │
   ├─────────────────────►│ /auth/callback        │                      │                    │
   │                      ├──────────────────────►│ POST /auth/social/callback                │
   │                      │                       ├─────────────────────►│ validate state     │
   │                      │                       │                      ├───────────────────►│ exchange code
   │                      │                       │                      │◄───────────────────┤ id_token
   │                      │                       │                      │ verify + link      │
   │                      │                       │◄─────────────────────┤ tokens             │
   │                      ├──────────────────────►│ POST /auth/cookie    │                    │
   │                      │                       ├─────────────────────►│ Set-Cookie httpOnly│
   │◄─────────────────────┤ assign(redirect) or router.push('/home')      │                    │
```

### 6.2 Endpoint contract

| Method | Path                                           | Auth | Success                                                          | Failure                                                    |
| ------ | ---------------------------------------------- | ---- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `GET`  | `/api/v1/auth/social/{google,apple}/authorize` | none | `302` + `Location`                                               | `400` bad `redirect`, `503` unconfigured, `429` rate limit |
| `POST` | `/api/v1/auth/social/callback`                 | none | `200` `{ success, data: { user, access_token, refresh_token } }` | `400` state/code, `409` conflict, `502` provider           |
| `POST` | `/api/v1/auth/cookie`                          | none | `200` `{ success: true }` + `Set-Cookie`                         | —                                                          |
| `GET`  | `/auth/callback` (web)                         | none | renders spinner → redirect                                       | renders login page with `?error=`                          |

Rate limits stay as they are: `10/min` on authorize and callback.

### 6.3 New / changed configuration

| Variable                             | Service      | Required | Notes                                                                              |
| ------------------------------------ | ------------ | -------- | ---------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`                   | auth-service | yes      | Already read; now documented (§8)                                                  |
| `GOOGLE_CLIENT_SECRET`               | auth-service | yes      | Already read; now documented                                                       |
| `GOOGLE_REDIRECT_URI`                | auth-service | yes      | **Now required.** Must be `{WEB_ORIGIN}/auth/callback`                             |
| `APPLE_CLIENT_ID`                    | auth-service | yes      | Apple **Services ID**, not the app bundle ID                                       |
| `APPLE_TEAM_ID`                      | auth-service | yes      | New — needed to mint the client secret JWT                                         |
| `APPLE_KEY_ID`                       | auth-service | yes      | New — key identifier from the Apple developer console                              |
| `APPLE_PRIVATE_KEY`                  | auth-service | yes      | New — `.p8` contents, ES256. Store as a secret, never in a tracked file            |
| `APPLE_REDIRECT_URI`                 | auth-service | yes      | **Now required.** Must be `{WEB_ORIGIN}/auth/callback`                             |
| `SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS` | auth-service | no       | Becomes redundant once FR-3 moves the target into `state`; remove in the follow-up |
| `NEXT_PUBLIC_PANEL_ORIGINS`          | apps/web     | no       | Already exists and is used by password login; reuse                                |

Where these values come from, how to register them with each provider, and how to verify the result on staging: [`docs/runbooks/social-auth-provider-credentials.md`](../runbooks/social-auth-provider-credentials.md).

### 6.4 Apple client secret `[COMPLETED]`

Apple does not issue a static client secret. `APPLE_CLIENT_SECRET` has been replaced by a minted JWT — see [`apple-client-secret.service.ts`](../../services/core/auth-service/src/modules/auth/social/apple-client-secret.service.ts):

```
header: { alg: 'ES256', kid: APPLE_KEY_ID }
claims: { iss: APPLE_TEAM_ID, iat: now, exp: now + 6 months (max),
          aud: 'https://appleid.apple.com', sub: APPLE_CLIENT_ID }
sign:   APPLE_PRIVATE_KEY (.p8), ES256
```

Mint it lazily, cache for slightly less than its `exp`, and never log it. This is the defect in §2 row 6 and is the single most likely reason a first staging attempt fails.

### 6.5 Files to change

| File                                                                      | Change                                                                                                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/core/auth-service/src/modules/auth/social/social.controller.ts` | Add redirecting authorize handler; make `code` optional-with-`error`                                                                           |
| `services/core/auth-service/src/modules/auth/social/social.service.ts`    | Store `redirect` in state; require provider redirect URIs; mint Apple secret JWT; add `aud`/`iss` checks; delete dead `redirectUri` validation |
| `services/core/auth-service/src/modules/auth/dto/social-auth.dto.ts`      | Conditional `code`/`error` validation                                                                                                          |
| `apps/web/src/app/auth/callback/page.tsx`                                 | **New** — GET + POST handler, cookie handoff, error branch                                                                                     |
| `apps/web/src/app/auth/login/page.tsx`                                    | Enable buttons, loading state, flag-driven visibility, drop caption                                                                            |
| `apps/web/src/app/globals.css`                                            | Keep `.az-btn-social:disabled`; add the loading affordance                                                                                     |
| `services/core/auth-service/.env.example`                                 | Document the OAuth block (§8, done)                                                                                                            |
| `apps/web/src/app/__tests__/auth-provider-buttons.test.tsx`               | Flip from "disabled" to "enabled when flag on"                                                                                                 |
| `services/core/auth-service/src/modules/auth/social/*.spec.ts`            | New branch coverage per §7                                                                                                                     |

### 6.6 Security checklist

- [ ] `state` single-use, 600s TTL, bound to provider, compared before code exchange.
- [ ] `redirect` never accepted from the provider response — only from the server-side state record.
- [x] Apple `aud` equals `APPLE_CLIENT_ID` and `iss` equals `https://appleid.apple.com` (2026-11-05, `social.apple-claims.spec.ts`).
- [ ] Google `aud` equals `GOOGLE_CLIENT_ID`.
- [ ] Apple `email_verified` checked before linking to an existing password account.
- [ ] No token reaches `localStorage` on the callback path.
- [ ] Provider error strings are mapped to fixed messages, never reflected.
- [ ] `state` and `code` never logged in full (current code logs first 8 chars — keep that).
- [ ] Optional hardening: add OIDC `nonce` to both providers and verify it on callback.

## 7. Test Plan

**Unit / integration (no live provider)**

| #   | Case                                                            | Expected                                                     |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Authorize with no session                                       | `302`, `Location` starts with `https://accounts.google.com/` |
| 2   | Authorize with `client_id` unset                                | `503`, no URL minted                                         |
| 3   | Callback with expired state                                     | `400`, generic message                                       |
| 4   | Callback with state belonging to the other provider             | `400`                                                        |
| 5   | Callback replaying a consumed state                             | `400`                                                        |
| 6   | Callback with `error=access_denied` and no `code`               | `400` with the cancelled message (this is §2 row 7)          |
| 7   | Callback with `redirect=https://admin.example` on the allowlist | cookie set, redirect preserved                               |
| 8   | Callback with `redirect=//evil.example`                         | falls back to `/home`                                        |
| 9   | Callback with `redirect=https://admin.example.evil.com`         | falls back to `/home`                                        |
| 10  | Google token with foreign `aud`                                 | `401`                                                        |
| 11  | Apple token with foreign `aud`                                  | `401`                                                        |
| 12  | Apple email unverified, existing password account               | `409`, no link                                               |
| 13  | Kill switch off                                                 | `503`                                                        |
| 14  | Web callback page, cookie handoff                               | `/auth/cookie` called once, then redirect                    |

Reuse the existing `first-party-redirect.test.ts` table for cases 7–9 rather than duplicating it.

**Manual, staging only (needs credentials)**

- [ ] Full Google round trip, new user, lands on `/home` authenticated.
- [ ] Full Apple round trip, new user. **Apple needs a real domain** — localhost is impossible for this provider.
- [ ] Returning user, both providers, no duplicate account created.
- [ ] Cancel consent, both providers, message shown, redirect preserved.
- [ ] `GET /api/v1/auth/me` with cookies only after each round trip.

**Gates that must stay green**

- `pnpm --filter @azeebo/web test`, `typecheck:client` for web
- auth-service suite, `check:dead-exports`, `check:env`
- `apps/web` Playwright `auth-provider-buttons` spec, updated

## 8. Step Completed In This Pass

`services/core/auth-service/.env.example` gained a documented Social Auth block covering `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_REDIRECT_URI`, and `SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS`. Before this, every one of those keys was referenced by the service and documented in no template, so a fresh clone could not know they existed.

`scripts/check-env-consistency.mjs` exits `0` with `0` failures. It did emit `STALE-EXAMPLE` warnings for these keys, and they were **false positives with a cause that is now fixed**: `GET_RE` required a trailing **`,`**, so only `configService.get('KEY', default)` was recognised — a required key read as `configService.get<string>('KEY')` with no default never counted as a read, making its `.env.example` line look stale. The comma is now optional (`\s*[,)]`), which clears those false stales repo-wide: `STALE-EXAMPLE` 130 → 111, none added, `check:env` still exits `0`. Pinned by `scripts/__tests__/env-consistency-reads.test.mjs`.

## 8a. FR-1 and FR-2 — implemented 2026-11-05

**auth-service**

- `GET /auth/social/{google,apple}/authorize` now answers `302` with `Location` set to the provider. `?format=json` returns the previous `{ state, authorizeUrl }` body, so nothing that consumed the JSON shape breaks.
- Provider configuration is required, not defaulted. A missing `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` returns `503` instead of minting a URL with an empty `client_id` that the provider answers with `invalid_client`.
- `GOOGLE_REDIRECT_URI` / `APPLE_REDIRECT_URI` are now the single source of truth and are used by both authorize and code exchange. They must match, and they must be the **web** callback, not the auth-service origin.
- The `redirect` target rides inside the Redis state record (`{ provider, redirect }`), consumed single-use on callback and returned to the browser client. Legacy bare-provider state records are still accepted, so an in-flight login during a rolling deploy does not fail.
- Removed the dead `redirectUri` allowlist check that validated a value the method then discarded.

**apps/web**

- New `app/auth/callback/route.ts` with `GET` **and** `POST`. A page component could not receive Apple's `form_post`; a route handler can, and filesystem routes take precedence over the `/auth/:path*` rewrite.
- Exchange happens server-side against `POST /api/v1/auth/social/callback`, then the same httpOnly jar the password path writes is applied — extracted into [`lib/auth-cookie-response.ts`](../../apps/web/src/lib/auth-cookie-response.ts) so the two paths cannot drift.
- Cookies are set `SameSite=lax` here (the password path stays `strict`): the callback is reached through a cross-site redirect chain, and `strict` cookies are withheld on that first navigation back into the app.
- The return target is re-validated with the existing `safeRedirectTarget`, so there is still exactly one allowlist.
- Every failure redirects to `/auth/login?error=<code>` with a message from [`lib/social-auth-errors.ts`](../../apps/web/src/lib/social-auth-errors.ts); the login page renders it in its existing `Alert`. No raw JSON anywhere.

**Verification:** web `tsc --noEmit` clean; 501 web tests pass (48 files), including 17 new callback-route tests covering every failure branch, the allowlist fallbacks, and Apple `form_post`; auth-service `tsc --noEmit` clean and `social.kill-switch.spec.ts` 7/7 with the updated 302 contract. `check:dead-exports` holds (2 unused exports were made module-private rather than lowering the ratchet).

**FR-6 DTO half (2026-11-05):** `SocialAuthCallbackDto.code` is conditional on `error`, so Apple's cancellation `form_post` reaches the handler rather than dying in the validation pipe. Tests: `social-auth.dto.spec.ts` (9) pins the rule from both sides including the empty-string `error` bypass, and `social.callback-pipe.spec.ts` (4) installs the real `ValidationPipe` and shows the two 400s are distinguishable by message. 20/20 across the three social suites.

**Apple client secret (2026-11-05):** `AppleClientSecretService` signs the client secret as an ES256 JWT with header `{ alg, kid }` and claims `{ iss: APPLE_TEAM_ID, iat, exp, aud: 'https://appleid.apple.com', sub: APPLE_CLIENT_ID }`, caches it in-process, and re-mints 60s before expiry or immediately when `APPLE_KEY_ID` changes. Lifetime is 180 days, inside Apple's 6-month ceiling. `APPLE_PRIVATE_KEY` is normalised for the single-line / escaped-newline form secret stores actually use, and surrounding quotes are tolerated. Missing credentials or an unparseable `.p8` raise `503` (deployment-shaped), never a 500 — and neither the key nor the token is ever logged. **12 tests** sign with a real EC P-256 key and verify with its public half, so the cryptography is exercised rather than mocked; they also pin rejection of a foreign key, the lifetime ceiling, cache reuse, key rotation, and each missing-key case.

**Apple ID token claims (2026-11-05):** `verifyAppleToken` now enforces `iss === 'https://appleid.apple.com'` and `aud` containing `APPLE_CLIENT_ID` after the RS256 signature check — Apple signs for every client with one JWKS, so the signature alone never proved the token was minted _for us_. The expected client id comes from `AppleClientSecretService.getClientId()` (one source of truth with the minted secret's `sub`), which throws `503` when unset so the check fails closed. Separately, a token that fails JWT verification now returns `401` instead of falling through `mapAndThrow` to a `500`. **9 tests** in `social.apple-claims.spec.ts` sign real RS256 tokens against a generated keypair served as the JWKS — foreign client, foreign issuer, missing issuer/audience, audience arrays, foreign signature, and the unconfigured-client `503`. **Still open:** the Google `aud` check, and the legacy `social-auth` endpoint (AUD-85) which verifies no signature at all.

**FR-7 + FR-8 (2026-11-05):** the buttons are live and flag-driven.

- `auth_social_google` / `auth_social_apple` are registered in the gateway's `defaultFlags` **and** `publicFlagKeys`, so `/feature-flags/bootstrap` serves them. Without the second half the flag evaluates deny-by-default and the button would never render — the gateway's bootstrap guard now asserts both keys.
- The login page reads them through the existing `useFlags()` store, not a build-time constant. A provider with its flag off **does not render** (hidden, not a disabled button that looks like a tease); if both are off the "or" divider and the grid disappear too.
- Fails closed: the flag store reports `false` until bootstrap resolves, so a gateway outage hides the providers rather than offering a path that will 503. Password login is never gated by a provider flag.
- Click → `disabled` + `aria-busy="true"` + spinner + label "Redirecting to Google…", and **both** buttons lock so only one hand-off can be in flight. Navigation is a full `window.location.assign` because the authorize endpoint answers with a 302 the App Router cannot render.
- The "not available yet" caption is gone.

**Verification:** gateway `tsc` clean and the bootstrap guard passes with the two auth keys asserted; web `tsc` clean, **511/511** tests across 49 files, including 6 rewritten provider-button tests (both on, one off, both off, in-flight lock, navigation target) and 5 URL-builder tests. Live dev server: `/auth/login` renders 200 with no `FlagsProvider` error and no stale caption; with no gateway running the provider section is correctly absent (fail-closed).

**Repaired 2026-11-05:** `auth.integration.spec.ts` and `device-link.integration.spec.ts` — the only two specs that boot `AuthModule` on its own — could not build their Nest module (`ErasureConsumerService` → missing `EVENT_BUS_SERVICE`). This was a harness gap rather than a production defect: `EventBusModule` is `@Global()` and `AppModule` registers it, so the real app resolves it — but these specs import `AuthModule` outside that global scope. Both now register `EventBusModule.forRoot(..., { enableEnhanced: false })` (one provider, no Redis) and override the token with a stub whose `subscribe()` returns a promise. Both also raise the per-test timeout to 30 s, matching `roles.guard.integration.spec.ts`: they boot a real app and run bcrypt per credential check, so the 5 s default failed as timeouts whenever the machine was loaded, not on assertions. `auth` + `device-link` suites are green: **12/12 suites, 152 tests** at load averages 44–65. The `mfa.service.spec.ts` intermittent was a separate defect (a 5 s timeout on the one test that runs five cost-12 bcrypt hashes, plus an `otpauth` mock whose `null` leaked between tests), root-caused and fixed in `audit.md` §9.7: **15/15 suites, 172 tests, 0 timeouts** with 4 CPU burners running.

## 9. Acceptance Criteria

1. A signed-out browser reaches the authorize entry and is taken to the provider — no `401`, no JSON page.
2. Returning with a valid `code` establishes the same httpOnly session password login establishes; `GET /api/v1/auth/me` with cookies only authenticates.
3. `?redirect=` to an allowlisted panel origin returns the user to that panel; `//evil.example`, a non-listed first-party origin, and a bare path all resolve to the documented fallbacks.
4. Tampered, expired, replayed, and cross-provider `state` are all rejected without revealing which check failed.
5. Every failure mode in §FR-6 renders on the login page with the mapped message; no raw JSON reaches a user.
6. `auth_social_google` and `auth_social_apple` kill switches disable each provider end to end, button included.
7. Apple sign-in succeeds against a staging domain using a minted ES256 client secret.
8. Web and auth-service suites, both `typecheck:client`s, `check:dead-exports`, and `check:env` stay green.

## 10. Risks & Open Decisions

| Risk                                       | Impact                                                                                  | Mitigation                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Apple requires a real registered domain    | Blocks Apple verification locally                                                       | Verify Apple only in staging; treat Google as the local proof                                   |
| Apple private key handling                 | A committed `.p8` is a credential leak (this repo already purged history once — AUD-05) | Secrets manager only; add to `.gitignore`; rotate on any suspicion                              |
| Silent account linking by email            | Account takeover if a provider stops asserting verified email                           | Gate linking on the verified claim; log every link                                              |
| Two allowlists drift                       | Open redirect                                                                           | One helper (`safeRedirectTarget`); delete `SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS` in the follow-up |
| Legacy `POST /social/{p}` endpoints remain | Unverified-by-design bypass of the new flow                                             | Out of scope; track as a deprecation ticket                                                     |

**Decisions needed**

1. **MFA for social logins** — skipped entirely, or force MFA for `role` ≥ admin? Recommend: skip for `user`, require password+MFA for admin/creator roles, enforced at the gateway.
2. **Button placement** — keep the 2-up grid under the password form (recommended, matches current design), or move above with an "or" divider.
3. **`ENABLE_SOCIAL_AUTH` env flag** — it is documented in `.env.example` but the real gates are the per-provider `authFlags`. Recommend deleting the env var to avoid two competing switches.
4. **Legacy endpoint deprecation date** — needed before this ships, so the old path can be removed on a schedule.
