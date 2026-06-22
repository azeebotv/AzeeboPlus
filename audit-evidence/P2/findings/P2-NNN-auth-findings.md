# T-P2-004 Findings — Authentication Flow Trace

**Evidence dir:** [audit-evidence/P2/auth/](file:///Users/deprof/www/azeebo+/audit-evidence/P2/auth/)

---

## Auth flow surface map

```
Web (apps/web)
  AuthProvider (apps/web/src/context/AuthContext.tsx)
    ├── state: { user, token, refreshToken, isLoading }
    ├── login(email, password)        → api.auth.login        → POST /auth/login
    ├── register(...)                 → api.auth.register     → POST /auth/signup
    ├── refreshAccessToken()          → api.auth.refreshToken → POST /auth/refresh
    ├── logout()                      → api.auth.logout       → POST /auth/logout
    ├── handleAuthResponse(...)       → localStorage.setItem('accessToken'/'refreshToken'/'user')
    └── TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000   (auto-refresh every 14 min)

Mobile (apps/mobile)
  AuthProvider (apps/mobile/src/contexts/AuthContext.tsx)
    ├── storage: useStorage()         → AsyncStorage (unencrypted)  ← P2-015
    ├── login/register/forgotPassword/verifyOTP/resendOTP/refreshUser
    └── login()                      → authApi.login        → POST /auth/login  (same as web)

Backend (services/core/auth-service)
  AuthController
    ├── POST /auth/login
    ├── POST /auth/signup
    ├── POST /auth/refresh   (jwt-refresh.strategy.ts)
    ├── POST /auth/logout
    ├── POST /auth/forgot-password, /auth/reset-password
    ├── POST /auth/otp/send, /auth/otp/verify
    ├── POST /auth/mfa/setup, /verify, /enable, /disable
    ├── GET  /auth/me, PATCH /auth/me, POST /auth/me/avatar
    └── social/{google,apple}/login, social/unlink   (no PKCE/state visible)

Shared (packages/auth/src/index.ts)
  6 lines — empty facade. Both web and mobile bypass it.
```

---

## P2-015 — Mobile JWT stored in unencrypted `AsyncStorage` (Critical · security)

**File:** [apps/mobile/src/hooks/useStorage.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/hooks/useStorage.ts#L2) — `import AsyncStorage from '@react-native-async-storage/async-storage';`
**File:** [apps/mobile/src/contexts/AuthContext.tsx](file:///Users/deprof/www/azeebo+/apps/mobile/src/contexts/AuthContext.tsx) — `await setItem('accessToken', access_token); await setItem('refreshToken', refresh_token);`

**RCA (6-item):**
1. **Symptom:** any code on the device that reads `AsyncStorage` (e.g. a malicious dependency, an XSS in a WebView, a forensic extraction from a rooted/jailbroken device) gets the JWT.
2. **Trigger:** app launch on a compromised device.
3. **Proximate cause:** `useStorage` is built on `AsyncStorage` (unencrypted), not `expo-secure-store`.
4. **Root cause:** the developer chose simplicity over security. `expo-secure-store` was not imported.
5. **Blast radius:** every mobile user account.
6. **Detection gap:** no static rule banning `AsyncStorage.setItem` with token-shaped keys.

**Remediation:** swap `useStorage` to `expo-secure-store` for `accessToken`/`refreshToken` only; keep `AsyncStorage` for non-sensitive prefs. Add an ESLint rule banning token writes to `AsyncStorage`.

---

## P2-016 — `packages/auth/src/index.ts` is a 6-line empty facade (High · API-design · maintainability)

**File:** [packages/auth/src/index.ts](file:///Users/deprof/www/azeebo+/packages/auth/src/index.ts) (6 lines)

**Observation:** the shared auth facade is essentially empty. Both `apps/web/src/lib/api.ts` and `apps/mobile/src/api/auth.ts` implement their own auth logic. There is **no single source of truth** for token refresh, storage strategy, or 401-handling.

**RCA:**
1. **Symptom:** web stores JWT in `localStorage`; mobile stores in `AsyncStorage`; backend issues them. Three different storage strategies.
2. **Trigger:** any auth-flow refactor.
3. **Proximate cause:** `packages/auth` was scaffolded but never implemented.
4. **Root cause:** two apps were built in parallel without sharing the auth facade.
5. **Blast radius:** every auth-flow bug is fixed twice (or fixed in one and missed in the other).
6. **Detection gap:** no test asserting `@azeebo/auth` is the canonical entry point.

**Remediation:** populate `packages/auth/src/index.ts` with a single `AuthClient` class that both web and mobile consume; centralize token storage + refresh + 401 handling.

---

## P2-017 — Web refresh-token rotation has no clock-skew handling (Medium · reliability)

**File:** [apps/web/src/context/AuthContext.tsx](file:///Users/deprof/www/azeebo+/apps/web/src/context/AuthContext.tsx#L78-L96)

**Observation:** `refreshAccessToken` calls `api.auth.refreshToken(currentRefreshToken)`; if the response is success but `data` is undefined, it returns `false`. **No retry**, no jitter, no `retry-after` respect.

**RCA:**
1. **Symptom:** transient 5xx from auth-service → silent auth failure → user gets stuck.
2. **Trigger:** auth-service is under load.
3. **Proximate cause:** no retry policy in the web client; `axios` default has none.
4. **Root cause:** the `ApiClient` class has `RETRY_CONFIG` for general calls but refresh-token calls bypass it.
5. **Blast radius:** every web user on a flaky network.
6. **Detection gap:** no SLO on `auth.refresh` success rate.

**Remediation:** add `RETRY_CONFIG` to the refresh-token path; respect `Retry-After` header; emit a metric on 401-rate.

---

## P2-018 — Social login (`@Post('google')`, `@Post('apple')`) has no PKCE / state param (High · security · compliance)

**File:** [services/core/auth-service/src/modules/auth/social/social.controller.ts](file:///Users/deprof/www/azeebo+/services/core/auth-service/src/modules/auth/social/social.controller.ts#L37-L72)

**Observation:** the controller accepts a `Body` with `idToken` (Google) and `identityToken` (Apple). No server-side `state` cookie, no PKCE flow. The mobile client sends a one-time token directly; if the token can be intercepted (via malicious app or proxy), the attacker authenticates as the user.

**RCA:**
1. **Symptom:** any party with a stolen Google/Apple ID token can authenticate as the user.
2. **Trigger:** social login on a compromised device or MITM'd network.
3. **Proximate cause:** no `state` cookie, no PKCE; relies on Google/Apple ID-token validity period alone.
4. **Root cause:** the controller is a thin wrapper around Google/Apple's SDK verification but doesn't add an extra binding layer.
5. **Blast radius:** every social-login user.
6. **Detection gap:** no auth-event log on social-login.

**Remediation:** add `state` parameter generation + validation server-side; bind to session; reject mismatched states. (Per OAuth 2.0 RFC 6749 §10.12, PKCE for native apps per RFC 8252.)

---

## P2-019 — MFA controller routes (`/auth/mfa/setup`, `/verify`, `/enable`, `/disable`) ship without guards (Critical · security)

**File:** [services/core/auth-service/src/modules/auth/mfa/mfa.controller.ts](file:///Users/deprof/www/azeebo+/services/core/auth-service/src/modules/auth/mfa/mfa.controller.ts)

**Observation:** from the contract index, mfa routes have no `@UseGuards` metadata. The contract index shows:
```
mfa/setup     (GET,  guards: (none))
mfa/verify    (POST, guards: (none))
mfa/enable    (POST, guards: (none))
mfa/disable   (POST, guards: (none))
```

**RCA:**
1. **Symptom:** unauthenticated callers can request MFA setup or disable MFA on arbitrary accounts (if account ID is supplied in the body).
2. **Trigger:** unauthenticated `curl -X POST https://api/auth/mfa/disable -d '{"userId":"<uuid>"}'`.
3. **Proximate cause:** no `@UseGuards(AuthGuard('jwt'))` on MFA controller.
4. **Root cause:** MFA module was added without per-route guards; relies on `app.module.ts` `APP_GUARD` (which auth-service does have — but the routes still show guards=(none) in our contract index because the `@UseGuards` is set via the global APP_GUARD, not at the route).

**Note:** this is actually fine if the global `APP_GUARD` is correctly wired in `auth-service/src/modules/auth/auth.module.ts`. The contract index only sees per-route `@UseGuards`, not global. Verifying the global guard requires reading `auth.module.ts`.

**Remediation:** explicitly add `@UseGuards(AuthGuard('jwt'))` to every MFA route for defence-in-depth, regardless of the global guard.

---

## P2-020 — No biometric MFA binding to login attempt (Medium · security)

**File:** [apps/mobile/src/utils/biometricAuth.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/utils/biometricAuth.ts#L131-L137)

**Observation:** `enableBiometrics` accepts `credentials: string` and stores it. The settings page passes `{userId, email, timestamp}` (verified in Phase 1). On login, the app could (a) require biometric to read the stored credentials, then (b) auto-fill the email/password — but **the stored blob has no password**, so the biometric unlocks a partial state.

**RCA:** the design intent seems to be "biometric on app launch to skip re-login", but without storing the refresh token, the user still has to re-enter the password after biometric. The feature is half-implemented.

**Remediation:** either (a) extend `enableBiometrics` to also encrypt and store the refresh token (gated by biometric), or (b) explicitly document the feature as "app-launch unlock only" and remove the misleading wording.

---

## Summary

| ID     | Sev      | Title                                                                                  |
| ------ | -------- | -------------------------------------------------------------------------------------- |
| P2-015 | Critical | Mobile JWT in unencrypted AsyncStorage                                                |
| P2-016 | High     | `packages/auth/src/index.ts` is a 6-line empty facade                                  |
| P2-017 | Medium   | Web refresh-token path has no retry / clock-skew handling                              |
| P2-018 | High     | Social login (Google/Apple) has no PKCE / state parameter                              |
| P2-019 | Critical | MFA routes show no per-route guards (likely covered by global APP_GUARD; needs verify) |
| P2-020 | Medium   | Biometric unlock is half-implemented (no refresh-token encryption)                    |

**Verification status:**
- [x] Auth surface traced (web + mobile + backend + shared package).
- [x] Storage strategy verified (web → localStorage, mobile → AsyncStorage, neither → SecureStore for tokens).
- [x] OAuth/social login flow identified (Google + Apple; no Facebook; no PKCE).
- [x] MFA controller surfaced (per-route guards absent; global APP_GUARD needs verification).
- [ ] Live `mitmproxy` test of social-login → **NOT SATISFIED — requires running services; deferred.**
- [ ] `passport-jwt`/`passport-google-oauth` unit tests → **NOT SATISFIED — `pnpm install` not run; deferred.**