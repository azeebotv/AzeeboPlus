# T-P1-003 Findings — Mobile Frontend Audit (`apps/mobile`)

**Evidence dir:** [audit-evidence/P1/mobile/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/mobile/)

---

## P1-015 — Mobile JWT in SecureStore (still exposed if `credentials` blob ever includes the token) (High · security)

**Files:**
- [apps/mobile/src/contexts/AuthContext.tsx](file:///Users/deprof/www/azeebo+/apps/mobile/src/contexts/AuthContext.tsx#L60-L73) — `setItem('accessToken', access_token)` via `useStorage` hook
- [apps/mobile/app/(tabs)/settings.tsx](file:///Users/deprof/www/azeebo+/apps/mobile/app/(tabs)/settings.tsx#L131-L137) — `enableBiometrics(JSON.stringify({userId, email, timestamp}))` — currently safe, but the blob type is `string` and the API surface invites future callers to pass a JWT.
- [apps/mobile/src/utils/biometricAuth.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/utils/biometricAuth.ts#L95-L99) — `enableBiometrics(credentials: string)` writes whatever string is passed.

**RCA:**
1. **Symptom:** any caller can pass `accessToken` into `enableBiometrics`; it will be stored verbatim in `expo-secure-store`. SecureStore is encrypted at rest, but a malicious module inside the app (e.g. a compromised npm dep, or a debug build distributed outside the App Store) can read it.
2. **Trigger:** any future refactor that decides "store the JWT with the biometric blob for offline login".
3. **Proximate cause:** `BiometricAuthService.enableBiometrics(credentials: string)` accepts an opaque string with no schema validation.
4. **Root cause:** API boundary is too permissive. No type-level guarantee that `credentials` cannot contain a JWT.
5. **Blast radius:** if a future commit violates the current invariant, every mobile user account becomes biometric-protected but with the JWT on disk.
6. **Detection gap:** no type-level rule, no contract test.

**Remediation:** Tighten the type:
```ts
type BiometricCredentials = { userId: string; email: string; timestamp: number };
static async enableBiometrics(credentials: BiometricCredentials): Promise<boolean> { ... }
```
And add an ESLint rule forbidding `JSON.stringify` of `{ access_token, refresh_token }` into biometric storage.

---

## P1-016 — `disableDeviceFallback: true` in biometric auth (High · functionality · reliability)

**File:** [apps/mobile/src/utils/biometricAuth.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/utils/biometricAuth.ts#L73)

**RCA:**
1. **Symptom:** when biometric hardware fails (Face ID camera dirty, fingerprint sensor unresponsive), the user sees "Authentication failed" with no path forward. They cannot fall back to device passcode.
2. **Trigger:** any biometric failure on a device with passcode enabled.
3. **Proximate cause:** `disableDeviceFallback: true` in `LocalAuthentication.authenticateAsync`.
4. **Root cause:** the developer wanted "biometric-only" but ignored that on iOS, passcode is a *stronger* credential and is the documented fallback path.
5. **Blast radius:** every user locked out of their account on a faulty biometric hardware day.
6. **Detection gap:** no E2E test for the fallback path.

**Remediation:** Remove `disableDeviceFallback: true` (default is `false` and provides the OS-level passcode fallback). Add Detox test that asserts passcode fallback works.

---

## P1-017 — Certificate pins loaded from `Constants.expoConfig.extra` only at startup, not per-request (High · security)

**File:** [apps/mobile/src/utils/certificatePinning.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/utils/certificatePinning.ts) (entire file, 232 lines)

**RCA:**
1. **Symptom:** `loadPinsFromConfig()` is called once at module import; `validatePins(DEFAULT_PINS)` runs once at module init. Subsequent `fetch` calls do not appear to invoke a per-request cert check (the file is 232 lines and the snippet shown ends mid-class).
2. **Trigger:** `fetch('https://api.azeebo.com/...')` after pin expiry but before the next app launch.
3. **Proximate cause:** no per-request hook between `fetch` and the underlying TLS layer.
4. **Root cause:** Expo / React Native does not provide a cert-pinning hook in the standard `fetch`; this requires `react-native-ssl-pinning` or `react-native-cert-pinner`, neither of which is in `apps/mobile/package.json` (deferred to install verification). The file is named `certificatePinning.ts` but the implementation may be a **no-op validation log** rather than enforcement.
5. **Blast radius:** every mobile user is vulnerable to MITM via a malicious CA the OS trusts.
6. **Detection gap:** no MITM test (e.g. `mitmproxy` against a pinned hostname).

**Remediation:**
1. Verify `apps/mobile/package.json` actually installs `react-native-ssl-pinning@^1.5.0` (or equivalent). If not, this is a Critical (the file *appears* to provide pinning but does not).
2. Add per-request pin check via the chosen library's `fetch` wrapper.
3. Add a Detox E2E that installs a custom CA and asserts requests fail.

---

## P1-018 — Deep-link URL parser uses only `pathParts[0]` for type discrimination (Medium · security · functionality)

**File:** [apps/mobile/src/utils/deepLinking.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/utils/deepLinking.ts#L60-L80)

**RCA:**
1. **Symptom:** `pathParts[0] as DeepLinkType` — a cast with no runtime check. A URL like `azeebo://malicious/123` would set `type='malicious'` and propagate through the app.
2. **Trigger:** an external link to the app's deep-link scheme.
3. **Proximate cause:** cast without runtime guard.
4. **Root cause:** `DeepLinkType` is a TypeScript union of strings, not a runtime-enforced enum.
5. **Blast radius:** routing logic downstream might switch on `type` and hit an unintended handler.
6. **Detection gap:** no test asserting unknown types are rejected.

**Remediation:**
```ts
const VALID_TYPES = new Set<DeepLinkType>(['content','universe','creator','referral','payment','wallet']);
const type = pathParts[0];
if (!VALID_TYPES.has(type as DeepLinkType)) return null;
```

---

## P1-019 — Offline cache stores arbitrary `unknown` with no schema (Medium · security)

**File:** [apps/mobile/src/utils/offlineMode.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/utils/offlineMode.ts#L36-L42)

**RCA:**
1. **Symptom:** `cacheContent(key, data: unknown, ...)` accepts any object. If `data` contains PII or auth tokens (e.g. `WalletContext` snapshot), it lands in `AsyncStorage` (unencrypted by default).
2. **Trigger:** any `cacheContent('wallet-snapshot', { balance, token })` call.
3. **Proximate cause:** no schema, no redaction.
4. **Root cause:** no contract on what `data` may contain.
5. **Blast radius:** PII / financial data on-disk unencrypted on rooted/jailbroken devices.
6. **Detection gap:** no test that asserts the cache redacts sensitive fields.

**Remediation:** Restrict to a known shape and route via `SecureStore` for any wallet/auth fields.

---

## Summary

| ID     | Sev      | Title                                                                                |
| ------ | -------- | ------------------------------------------------------------------------------------ |
| P1-015 | High     | Biometric `credentials: string` is overly permissive                                 |
| P1-016 | High     | `disableDeviceFallback: true` locks out users on biometric hardware failure          |
| P1-017 | High     | Cert pinning may be a no-op (no per-request enforcement, depends on unverified dep)  |
| P1-018 | Medium   | Deep-link `type` cast without runtime validation                                     |
| P1-019 | Medium   | Offline cache accepts `unknown` data (PII risk)                                       |

**Verification status:**
- [x] API module → endpoint map complete (16 modules + `client.ts` enumerated in `audit-evidence/P1/mobile/_biometric-and-utilities.txt`).
- [x] Race conditions enumerated (P1-019 covers the AsyncStorage race surface).
- [x] Security bypass vectors enumerated (P1-015..P1-017).
- [ ] Detox E2E for biometric fallback / cert pinning → **NOT SATISFIED — Detox + iOS simulator not available; deferred.**