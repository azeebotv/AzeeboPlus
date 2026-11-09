# Runbook: Social Sign-In Provider Credentials (Production)

> Registering, publishing, verifying, and rotating the Google and Apple OAuth
> credentials behind "Continue with Google / Apple" in **production**.
>
> Scope: **production only.** It uses its own Google OAuth client, its own Apple
> Services ID, and its own `.p8` key. Never reuse staging values. The staging
> procedure lives in [social-auth-provider-credentials.md](social-auth-provider-credentials.md).

Related: [prd-social-login.md](../product/prd-social-login.md) · `services/core/auth-service/src/modules/auth/social/` · [audit.md](../../audit.md) §9.10

> **Assumption to confirm before use.** This runbook assumes the production web
> origin is `https://azeeboplus.com`, with the callback at
> `https://azeeboplus.com/auth/callback`. The repo has no production env file to
> confirm this. Open the live production web app, read the origin from the
> address bar, and use that value everywhere below.

---

## 0. Preconditions

| #   | Requirement                                                   | Where it is set                                          |
| --- | ------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Production OAuth client and Apple key, distinct from staging  | Provider consoles, production projects only              |
| 2   | Redirect URI byte-identical in the provider console           | `GOOGLE_REDIRECT_URI` / `APPLE_REDIRECT_URI`             |
| 3   | Redirect URI targets the web app callback, never the API host | `https://azeeboplus.com/auth/callback` (assumed)         |
| 4   | Provider kill switch is on and tested                         | `auth_social_google` / `auth_social_apple` flags         |
| 5   | Google consent screen published and branding verified         | Google Auth Platform (see section 1)                     |
| 6   | Apple Services ID domain and Return URL registered            | Apple Developer → Identifiers → Services IDs (section 2) |

Do not start production sign-in until items 1–6 are complete and the
section 5 checks pass on production.

---

## 1. Google: production OAuth client and consent screen

The sign-in scopes are `openid`, `email`, and `profile`. These are identity
scopes, not sensitive or restricted scopes, so publishing does **not** trigger
sensitive-scope verification. Brand verification is still needed if the app
name or logo should appear on the consent screen.

1. Use a **separate production Google Cloud project**. Do not add production
   redirect URIs to the staging client.
2. **Google Auth Platform → Audience.**
   - **User type:** External.
   - **Publishing status:** move from _Testing_ to _In production_ (**Publish app**)
     before go-live. Testing allows only up to 100 listed test users and
     expires authorizations after 7 days.
   - **Identity-only exception:** when only `openid`, `email`, and `profile` are
     requested, Google does not require test-user listing and does not expire
     authorizations after 7 days. Do not add any other scope to this client
     without re-checking this section.
3. **Branding (Google Auth Platform → Branding).**
   - Set app name, support email, and logo.
   - Set the **homepage**, **privacy policy**, and **terms of service** URLs. All
     three must be public, on a domain you own, and on an authorised domain.
   - Verify domain ownership in Google Search Console for every domain used in
     the redirect URIs, homepage, and policy links.
   - Submit for **brand verification** if the logo or display name should show.
     Changing the name, logo, or app URLs can require re-verification. Until
     verification completes, expect Google to show the unverified-branding
     state. This is separate from the sensitive-scope warning, which the
     identity-only scopes do not trigger.
4. **Clients → Create client → Web application.**
5. **Authorised redirect URIs**, exactly one line:

   ```
   https://azeeboplus.com/auth/callback
   ```

   No `localhost` entry. No wildcards, fragments, or `#`. Propagation can take
   minutes to hours.

6. **Create**, then store the **Client ID** and **Client secret** in the
   production secret manager at once. The secret is shown only at creation. If
   it is lost, delete the client and start over.

---

## 2. Apple: production Services ID, Return URL, and `.p8`

Apple web sign-in needs a **primary App ID** with Sign in with Apple enabled,
a **production Services ID** (`APPLE_CLIENT_ID`), and a **key** (`.p8` plus
Key ID). Use a Services ID that is used for production only.

1. **Primary App ID.** Use the production app's App ID. Enable **Sign in with
   Apple** and mark it as the **primary App ID**. A Services ID cannot be
   configured without one.
2. **Services ID.** Register a new identifier in reverse-DNS form for production.
   Tick **Sign in with Apple**, then **Configure**:
   - **Primary App ID:** from step 1.
   - **Domains and Subdomains:** `azeeboplus.com`, bare host, no scheme.
   - **Return URLs:** `https://azeeboplus.com/auth/callback`, with scheme,
     matching what the service sends.
   - Apple requires a public HTTPS domain. `localhost` and raw IPs are rejected.
   - Sign in with Apple on the web does not use a domain association file.
     `/.well-known/apple-developer-domain-association.txt` belongs to Private
     Email Relay email-source registration, which is a separate feature.
3. **Key.** Keys → + → name it, tick **Sign in with Apple**, **Configure**, select
   the **primary App ID**, then register and **download the `.p8` once**.
   - Apple does not keep a copy and cannot re-issue the download. If it is lost,
     revoke the key and create another.
   - Record the **Key ID** (10 characters) and the **Team ID**.
   - Limit: **two Sign in with Apple keys per primary App ID.**

Store `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY` in the production
secret manager. Never commit the `.p8` or paste it into a ticket or chat.

---

## 3. Put the values into production

1. Store the secrets in the production secret manager. The deployment applies them
   on restart.
2. Set these eight keys. `services/core/auth-service/.env.example` is the list.

   ```dotenv
   GOOGLE_CLIENT_ID=<production client id>
   GOOGLE_CLIENT_SECRET=<secret manager>
   GOOGLE_REDIRECT_URI=https://azeeboplus.com/auth/callback

   APPLE_CLIENT_ID=<production Services ID>
   APPLE_TEAM_ID=<team id>
   APPLE_KEY_ID=<key id>
   APPLE_PRIVATE_KEY=<secret manager, .p8 contents>
   APPLE_REDIRECT_URI=https://azeeboplus.com/auth/callback
   ```

   There is no `APPLE_CLIENT_SECRET`. The auth service signs an ES256 JWT from
   the `.p8` on demand. `ENABLE_SOCIAL_AUTH` is not read by any code. Use the
   feature flags in section 4 instead.

3. `APPLE_PRIVATE_KEY` may be the full PEM with real newlines or a single line
   with literal `\n`. The service normalises both. If Apple returns 503 while
   the other keys are set, check the log for `Apple client secret signing
failed` first.
4. **Restart the auth service** after changing any of the eight keys. The Apple
   client secret is cached in-process.

---

## 4. Feature flags (kill switches)

`auth_social_google` and `auth_social_apple` gate the authorize endpoints and
decide whether each login button renders. Both default to `true`.

- **Admin UI:** production admin → _Global Feature Flags_ → search
  `auth_social_` → toggle.
- **Env equivalent:** `FEATURE_FLAG_DEFAULT_AUTH_SOCIAL_APPLE=false`, applied on the
  next boot.

Rules for production:

- Turn a flag **off before** revoking a credential, not after. Off hides the
  button and returns 403 on the endpoint.
- After a toggle, the web app keeps cached flags for up to **5 minutes**
  (`azeebo_flags_*` in localStorage).
- Do **not** set `staleAfter` on these flags. The stale sweep would disable
  sign-in silently.
- The flag service fails closed when Redis is unreachable, so a Redis outage
  looks like "sign-in is off" (403).
- Enable a flag only after section 5.1 passes for that provider.

---

## 5. Verify on production

### 5.1 Configuration smoke test (no browser)

```bash
API=https://api.azeeboplus.com

curl -sS "$API/api/v1/auth/social/google/authorize?format=json" | jq '{state, authorizeUrl}'
curl -sS "$API/api/v1/auth/social/apple/authorize?format=json"  | jq '{state, authorizeUrl}'
```

Expect HTTP 200. Confirm that `client_id` and `redirect_uri` in each
`authorizeUrl` match the production values. `redirect_uri` must decode to
exactly `https://azeeboplus.com/auth/callback`.

| Response                        | Meaning                              | Fix                |
| ------------------------------- | ------------------------------------ | ------------------ |
| 503 `sign-in is not configured` | a provider key is unset              | section 3, restart |
| 403                             | flag off, or flag Redis down         | section 4          |
| 429                             | rate limit, possibly temporary block | wait               |
| 200 with wrong `client_id`      | wrong key for this provider          | section 3          |
| 200 with stale `redirect_uri`   | env not reloaded                     | restart            |

### 5.2 Browser round trip

1. Open `https://azeeboplus.com/auth/login` in a private window with a real
   account you control. Use a personal Google account and an Apple ID.
2. Confirm both buttons are present.
3. Complete Google sign-in and confirm you land signed in.
4. Complete Apple sign-in. Apple POSTs back to the callback
   (`response_mode=form_post`), so the route must accept `POST`.
5. Check the auth service logs for `Social login success`. Tokens and secrets must
   not appear in the logs.

### 5.3 Failure codes

Failures return to `/auth/login?error=<code>`. Read the code, not the provider
page.

| Symptom                                            | Provider | Likely cause                                                                                          |
| -------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `redirect_uri_mismatch`                            | Google   | redirect URI differs from the console entry                                                           |
| `invalid_client` at authorize                      | Apple    | Services ID misconfigured, Return URL or domain not registered                                        |
| `invalid_client` at token                          | Apple    | minted secret rejected: wrong Team/Key ID, mangled `.p8`, or `APPLE_CLIENT_ID` is not the Services ID |
| `invalid_grant`                                    | both     | code reused or expired, or redirect URI differs at exchange                                           |
| `state_invalid`                                    | both     | stale or consumed state                                                                               |
| `unavailable`                                      | both     | auth service 503 or gateway failure                                                                   |
| `exchange_failed`                                  | both     | other upstream failure                                                                                |
| `401` `Google token invalid or email not verified` | Google   | rejected token or unverified email                                                                    |

Unit tests do not exercise the provider side. Only section 5.2 proves the
credentials work end to end.

---

## 6. Rotation (production policy)

Production rotates more often than staging. Schedule a rotation at least every
**90 days**, and rotate immediately after any suspected exposure, staff change,
or failed secret-store audit. Rotate during a low-traffic window, with a
break-glass owner on call.

### Google

1. **Clients → your production client → Add secret.** Both secrets are valid
   during overlap. Google allows at most two.
2. Update `GOOGLE_CLIENT_SECRET`, restart, and run section 5.2.
3. **Disable** the old secret, then run section 5.2 again. If it passes, **delete**
   it. Keep it disabled, not deleted, for one full business day in case you need
   to roll back.

The client ID cannot be rotated in place. A new client ID means a new client,
an updated `GOOGLE_CLIENT_ID`, and user re-consent.

### Apple

1. **Keys → +** create a new key under the same primary App ID. Download the
   `.p8` once and store it in the secret manager.
2. Set the new `APPLE_KEY_ID` **and** `APPLE_PRIVATE_KEY` together, then restart.
   Changing the Key ID invalidates the cached client secret. Always change both
   and restart.
3. Run section 5.2. Then **revoke** the old key. Apple allows two keys per
   primary App ID, so revoke before creating a third.

The Services ID is effectively permanent. Changing it means new domains and
Return URLs, an updated `APPLE_CLIENT_ID`, and invalidating every ID token issued
for the old Services ID.

### Limits from the providers

- Google: at most two client secrets per client. The secret cannot be read
  again after creation.
- Apple: at most two keys per primary App ID. A `.p8` can be downloaded only
  once. The client secret JWT may be valid for up to six months, and this
  deployment mints 180-day secrets.

---

## 7. Turn it off / roll back

| Situation                                 | Action                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Provider outage or bad credentials        | Turn the provider's flag off (section 4). Immediate, no deploy.                   |
| Endpoint must be dead regardless of flags | Unset that provider's client ID and redirect URI, restart. Authorize returns 503. |
| Bad rotation                              | Restore the previous values, restart, then run section 5.2.                       |

Unsetting credentials does not break boot. A missing key returns 503 at the
authorize endpoint.

---

## 8. Known gaps

These gaps are recorded in [audit.md](../../audit.md) §9.10 and
[prd-social-login.md](../product/prd-social-login.md). Setup does not close them:

1. **Google `aud` is not checked.** `verifyGoogleToken` calls `tokeninfo` and does
   not compare `aud` to `GOOGLE_CLIENT_ID`. A token minted for another Google
   client would be accepted. Mitigation is a dedicated production client.
   This is not a code-level check.
2. **`tokeninfo` is debugging-grade** and can be throttled. A burst of sign-ins
   can fail with valid tokens.
3. **Legacy direct-token endpoints** `POST /auth/social/google` and
   `modules/social-auth` still exist. The Apple direct-token route
   (`POST /auth/social/apple`) is retired. Keep the remaining legacy routes off
   the public surface.
4. **No automated test covers a live provider exchange.** Section 5.2 is the only
   end-to-end check.
5. **Apple relay emails.** Users who hide their email appear as
   `@privaterelay.appleid.com`. Apple's `email_verified` can be a string or a
   boolean. Code must accept both.

---

## 9. Sign-off checklist

- [ ] Production web origin confirmed from the live app (the assumed value is `https://azeeboplus.com`)
- [ ] Google: production project, consent screen published (In production)
- [ ] Google: homepage, privacy, and terms URLs set and on verified domains
- [ ] Google: brand verification submitted, or the unverified state accepted
- [ ] Google: redirect URI registered exactly as `GOOGLE_REDIRECT_URI`
- [ ] Google: client ID and secret stored in the production secret manager
- [ ] Apple: primary App ID has Sign in with Apple enabled
- [ ] Apple: production Services ID with domain `azeeboplus.com` and the Return URL
- [ ] Apple: `.p8` downloaded once and stored in the secret manager
- [ ] All eight keys set, auth service restarted
- [ ] `authorize?format=json` returns 200 for both providers with production values
- [ ] `auth_social_google` and `auth_social_apple` on, after section 5.1
- [ ] Browser round trip completed for both providers (section 5.2)
- [ ] Rotation owner and 90-day date recorded
- [ ] Secrets absent from git, logs, tickets, and chat
