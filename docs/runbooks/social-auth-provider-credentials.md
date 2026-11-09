# Runbook: Social Sign-In Provider Credentials (Staging)

> Registering, configuring, verifying and rotating the Google and Apple OAuth
> credentials that make "Continue with Google / Apple" work on staging.
>
> Scope: **staging only.** Production needs its own Services ID, its own OAuth
> client and its own `.p8` — see [Separate credentials per environment](#7-separate-credentials-per-environment-why) before reusing anything.

Related: [prd-social-login.md](../product/prd-social-login.md) · `services/core/auth-service/src/modules/auth/social/` · [audit.md](../../audit.md) §9.10

---

## 0. What has to be true before a login can succeed

Five independent things. All five, or the flow dies at a different place:

| #   | Requirement                                                          | Owner                              | Where it is set                                                                                   |
| --- | -------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Provider credentials (client ID + secret; for Apple, team/key/`.p8`) | whoever holds the provider account | Coolify staging env (mirrored as keys in [staging.env.example](../../deploy/staging.env.example)) |
| 2   | Redirect URI registered **byte-identically** in the provider console | same                               | `GOOGLE_REDIRECT_URI` / `APPLE_REDIRECT_URI`                                                      |
| 3   | Redirect URI points at the **web app**, not the API                  | this runbook                       | `https://staging.azeeboplus.com/auth/callback`                                                    |
| 4   | Kill switch for the provider is on                                   | ops                                | `auth_social_google` / `auth_social_apple` feature flags                                          |
| 5   | Public HTTPS on the staging host                                     | infra                              | Coolify TLS / DNS                                                                                 |

### Staging addresses (as configured today)

| Thing                                | Value                                                                                                   | Source                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Web origin (login page, callback)    | `https://staging.azeeboplus.com`                                                                        | `ALLOWED_ORIGINS` + `NEXT_PUBLIC_BASE_URL` in [staging.env.example](../../deploy/staging.env.example) |
| API / gateway                        | `https://staging-api.azeeboplus.com`                                                                    | `NEXT_PUBLIC_API_URL`                                                                                 |
| Callback the providers must be given | `https://staging.azeeboplus.com/auth/callback`                                                          | [apps/web/src/app/auth/callback/route.ts](../../apps/web/src/app/auth/callback/route.ts)              |
| Callback the web app calls           | `POST https://staging-api.azeeboplus.com/api/v1/auth/social/callback`                                   | same file                                                                                             |
| Browser entry points                 | `/auth/social/google/authorize`, `/auth/social/apple/authorize` (same-origin, rewritten to the gateway) | [apps/web/src/lib/social-authorize.ts](../../apps/web/src/lib/social-authorize.ts)                    |

> **Confirm the host before you type it into a console.** Provider consoles
> match the redirect URI exactly (scheme, case, trailing slash), and an
> unregistered URI is an opaque provider error, not a useful message. The
> canonical staging host is `staging.azeeboplus.com`. It is the value in
> [deploy/staging.env.example](../../deploy/staging.env.example) and the
> staging fallback in [.github/workflows/cd.yml](../../.github/workflows/cd.yml).
> If the running staging web app reports a different origin, fix the config
> before you register anything. Open the staging web app, read the origin from
> the address bar, and register _that_.

### The four env keys per provider

`services/core/auth-service/.env.example` is the authoritative list:

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

APPLE_CLIENT_ID=        # the Services ID, NOT the App ID or the bundle id
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=      # the .p8 contents — secret store only
APPLE_REDIRECT_URI=
```

There is deliberately **no** `APPLE_CLIENT_SECRET`: Apple has no static client
secret. The auth service signs an ES256 JWT with the `.p8` on demand
([apple-client-secret.service.ts](../../services/core/auth-service/src/modules/auth/social/apple-client-secret.service.ts)),
caches it in-process for 180 days (Apple caps it at ~6 months) and re-mints it
if `APPLE_KEY_ID` changes.

Only these eight keys are involved. `ENABLE_SOCIAL_AUTH` appears in the same
`.env.example`, but **no code reads it** — flipping it does nothing. The real
switch is the feature flags in step 4.

---

## 1. Google: create the staging OAuth client

1. Open <https://console.cloud.google.com> and select (or create) a **separate
   staging project**. Do not add staging redirect URIs to the production
   client.
2. **Google Auth Platform → Audience** (older UI: _APIs & Services → OAuth
   consent screen_). Register the app if prompted. Then set:
   - **User type:** External
   - **Publishing status:** Testing — correct for staging, no verification
     needed.
   - **Test users:** add every Google account that will sign in (cap: 100).
     Google exempts plain sign-in (`openid email profile`) from the warning
     screen and the 7-day expiry — but this deployment also asks for
     `access_type=offline`, which pulls a refresh token into the Testing-status
     rules, so add the accounts and expect the consent screen regardless.
   - **App name / support email / authorised domains:** fill in with the
     staging host.
3. **Google Auth Platform → Clients → Create client → Web application.**
4. **Authorised redirect URIs** — add exactly, one per line:

   ```
   https://staging.azeeboplus.com/auth/callback
   http://localhost:4000/auth/callback      # optional, dev boxes only
   ```

   `http://localhost` is the one HTTP exemption Google allows; everything else
   must be HTTPS. No wildcards, no fragments, no `#`. Ports ≠ 80/443 must be
   spelled out. Changes can take **5 minutes to a few hours** to take effect.

5. **Create**, then copy the **Client ID** and **Client secret** immediately.
   Since June 2025 the secret is shown **once** and only its last four
   characters remain visible afterwards. If you lose it before storing it,
   delete the client and start over.

> The auth service asks for `access_type=offline` and `prompt=consent`, so a
> Testing-status project issues short-lived refresh tokens (7 days). Staging
> discards the provider tokens after reading the ID token, so this is noise
> rather than breakage — but expect the consent screen on every sign-in.

---

## 2. Apple: Services ID, Return URL and `.p8`

Apple web sign-in needs three artefacts: a **primary App ID** with the Sign in
with Apple capability, a **Services ID** (this is `APPLE_CLIENT_ID`), and a
**key** (`.p8` + Key ID).

1. **App ID.** _Certificates, Identifiers & Profiles → Identifiers → App IDs._
   Either use the existing iOS app's App ID (enable **Sign in with Apple** and
   set it as the **primary App ID**) or register a new App ID and mark it
   primary when enabling the capability. A Services ID cannot be configured
   without a primary App ID.
2. **Services ID.** _Identifiers → + → Services IDs._ Description + identifier
   in reverse-DNS form (e.g. `ng.azeebo.web.staging`). Register, select it,
   tick **Sign in with Apple**, then **Configure**:
   - **Primary App ID:** the one from step 1.
   - **Domains and Subdomains:** `staging.azeeboplus.com` — **bare host, no scheme**.
   - **Return URLs:** `https://staging.azeeboplus.com/auth/callback` — **with the
     scheme**, absolute, matching what we send character for character.
   - Save.
   - Apple **requires** the host to be a real domain over public HTTPS.
     `localhost` and raw IPs are rejected outright, and the domain cannot carry
     a fragment. A dev box therefore needs a public tunnel hostname registered
     here too — the `http://localhost:4000/auth/callback` sample in
     `.env.example` can never work for Apple.
   - No association file is needed for Sign in with Apple on the web. The
     `/.well-known/apple-developer-domain-association.txt` file belongs to
     Private Email Relay _email source_ registration, which is a different
     feature.
3. **Key.** _Keys → + →_ name it, tick **Sign in with Apple**, **Configure** →
   pick the **primary App ID** → Save → Continue → Register → **Download**.
   - The download is a `.p8` (PEM-armoured PKCS#8 EC P-256 key) and can be
     fetched **exactly once**. Apple does not keep a copy; losing it means
     revoking the key and creating another.
   - Note the **Key ID** (10 characters) from the key detail page, and your
     **Team ID** (top right of the developer account).
   - Limit: **two keys per primary App ID.** For rotation, create the new key
     first, deploy it, verify, then revoke the old one.

Store the three values as `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`.

---

## 3. Put the values into staging

1. **Secrets go into Coolify's staging environment** (the deployment applies
   them on restart). Never commit them and never paste the `.p8` into a ticket,
   chat, or a log line.
2. Mirror the _keys_ — values replaced with `<set-via-secrets-manager>`, matching
   the existing convention — in [deploy/staging.env.example](../../deploy/staging.env.example).
   The block is already there; keep it in sync if variable names change.
3. `APPLE_PRIVATE_KEY` handling:
   - Either paste the entire file **with real newlines**, or the single-line
     form with **literal `\n`** — the service normalises both, and strips
     wrapping quotes before signing.
   - Some secret stores mangle the value; the service logs
     `Apple client secret signing failed: <cause>` and answers 503 rather than
     logging the key. Check that message first if Apple sign-in 503s while the
     other three Apple keys are set.
4. Client IDs and redirect URIs are not secrets, but keep them beside the
   secrets so the environment stays self-describing.

Restart the auth service after changing any of the eight keys —
`AppleClientSecretService` caches the minted secret in-process.

---

## 4. Feature flags (the kill switches)

`auth_social_google` and `auth_social_apple` gate the authorize endpoints
_and_ decide whether the login page renders each button
([social-authorize.ts](../../apps/web/src/lib/social-authorize.ts)).

**Both default to `true`** — registered in
[auth-service app.module.ts](../../services/core/auth-service/src/app.module.ts)
and in the gateway's public flag list
([api-gateway app.module.ts](../../services/gateway/api-gateway/src/app.module.ts)).
So a fresh deployment is live without touching flags. Use them the other way
round: as an instant off switch.

- **Admin UI:** `https://admin.staging.azeeboplus.com` → _Global Feature Flags_ →
  search `auth_social_` → toggle.
- **API equivalent:**

  ```bash
  curl -X PUT "$ADMIN_BASE/api/v1/admin/feature-flags/auth_social_apple" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"enabled": false, "owner": "auth", "description": "Apple sign-in"}'
  ```

- **Env equivalent** (no admin session needed, applies from next boot):
  `FEATURE_FLAG_DEFAULT_AUTH_SOCIAL_APPLE=false`.

Caveats that have bitten before:

- Turning a flag **off** hides the button and 403s the endpoint — do this _before_
  revoking a credential, not after.
- After a toggle, the web app keeps its cached bootstrap flags for **5
  minutes** (`azeebo_flags_*` in localStorage). Clear it if a button lingers.
- Do **not** set `staleAfter` on these two flags: the stale sweep
  auto-disables expired flags, which would silently turn sign-in off.
- The flag service **fails closed** when its Redis is unreachable, so a Redis
  outage looks exactly like "sign-in is off" (403).

Order matters: verify credentials **first** (step 5), then confirm the flags
are on. Flag on without credentials = a login button that leads to a 503.

---

## 5. Verify

### 5.1 Configuration smoke test — no browser, no provider

The authorize endpoint answers with the URL it would redirect to, which shows
the client ID and redirect URI exactly as the service will send them. Run it
per provider; `?format=json` avoids the 302:

```bash
API=https://staging-api.azeeboplus.com

curl -sS "$API/api/v1/auth/social/google/authorize?format=json" | jq '{state, authorizeUrl}'
curl -sS "$API/api/v1/auth/social/apple/authorize?format=json"  | jq '{state, authorizeUrl}'
```

Expected: HTTP 200 with a `state` and an `authorizeUrl` whose
`client_id` and `redirect_uri` are the values you registered. Percent-encoding
is normal; `redirect_uri` must decode to exactly
`https://staging.azeeboplus.com/auth/callback`.

| Response                                                 | Meaning                                                                                                | Fix                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| **503** `… sign-in is not configured on this deployment` | one or more of the provider keys is unset (`missing APPLE_TEAM_ID, …` is in the log)                   | step 3, then restart     |
| **403**                                                  | the provider's feature flag is off, or flag Redis is down                                              | step 4                   |
| **429**                                                  | 10/minute per IP per path; repeats also park the IP on a temporary block list (`rate_limit:blocked:*`) | wait it out              |
| 200 but `client_id` empty/odd                            | wrong key on the wrong provider                                                                        | step 3                   |
| 200 with a stale `redirect_uri`                          | env not reloaded                                                                                       | restart the auth service |

### 5.2 Full browser round trip

1. Open `https://staging.azeeboplus.com/auth/login` in a **private window**.
2. Both buttons should be present. If one is missing → its flag is off or the
   flag cache is stale (5 min).
3. **Google:** click, choose the test account, complete consent. Expect a
   redirect back to the app, signed in.
4. **Apple:** click, authenticate. Apple POSTs back to
   `https://staging.azeeboplus.com/auth/callback` (`response_mode=form_post`), which
   is why that route exports `POST` as well as `GET`.
5. Useful log lines in the auth service (state is truncated to 8 chars, codes to
   8 — no tokens are logged):
   - `google OAuth authorize initiated: state=…`
   - `Social callback: state validated, provider=apple, code=…`
   - `Social login success: new user created id=…` / `existing user id=…`

### 5.3 Failure → cause

Every failure returns to `/auth/login?error=<code>`; read the code, not the
provider page.

| Symptom                                                              | Provider | Likely cause                                                                                                                                                                                   |
| -------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `redirect_uri_mismatch` (Google page)                                | Google   | `GOOGLE_REDIRECT_URI` differs from the console entry — scheme, host, path, case or trailing slash. Propagation can take hours.                                                                 |
| Apple shows "invalid web service … " / `invalid_client` at authorize | Apple    | Services ID not fully configured (capability off, primary App ID unset), or `redirect_uri` not in the Services ID Return URLs, or the domain isn't registered                                  |
| `invalid_client` at the **token** step                               | Apple    | the minted client secret was rejected: wrong `APPLE_TEAM_ID` / `APPLE_KEY_ID`, mangled `.p8`, or `APPLE_CLIENT_ID` ≠ Services ID (its `sub`). Check `Apple client secret signing failed` first |
| `invalid_grant`                                                      | both     | code already used, or older than 5 minutes (Apple), or the redirect URI at exchange differs from the one at authorize                                                                          |
| login page `?error=state_invalid`                                    | both     | state missing/expired (>10 min in Redis) or already consumed — a stale tab, or a provider that dropped `state`                                                                                 |
| `?error=unavailable`                                                 | both     | auth service 503 or the gateway was unreachable mid-flow                                                                                                                                       |
| `?error=exchange_failed`                                             | both     | any other upstream failure; provider error text is deliberately not echoed                                                                                                                     |
| `?error=account_conflict`                                            | both     | an upstream 409. Note the _identity already linked to another user_ case is thrown as a 401 (`Social account already linked to another user`) and therefore surfaces as `exchange_failed`      |
| `401` in logs: `Apple token was issued for a different client`       | Apple    | the ID token's `aud` is not this deployment's `APPLE_CLIENT_ID` — you are signing in with a client registered elsewhere (e.g. a token from another environment's Services ID)                  |
| `401`: `Apple token was not issued by Apple`                         | Apple    | `iss` mismatch — not an Apple-issued token                                                                                                                                                     |
| `401`: `Apple token could not be verified`                           | Apple    | signature/expiry/algorithm failure — forged or expired token, not a server fault                                                                                                               |
| `401`: `Google token invalid or email not verified`                  | Google   | tokeninfo rejected the token, or the Google account has no verified email                                                                                                                      |

`tsc`, unit tests and the JWKS-backed claim tests do **not** exercise the
provider side. Only 5.2 proves the credentials work end to end.

---

## 6. Rotation

### Google

1. **Google Auth Platform → Clients → your client → Add secret.** The new
   secret appears _below_ the old one, both enabled (max two).
2. Update `GOOGLE_CLIENT_SECRET` in Coolify, restart, verify 5.2.
3. **Disable** the old secret (immediately rejected in flows; re-enable if you
   need to roll back), then **Delete** it.

Rotation is safe to do during business hours — the two secrets are valid
simultaneously, so an in-flight flow cannot fail between steps.

The client ID cannot be rotated in place; a new client ID means a new console
client and a new `GOOGLE_CLIENT_ID`, and users re-consent.

### Apple

1. **Keys → +** → new key, same primary App ID → download once.
2. Set the new `APPLE_KEY_ID` **and** `APPLE_PRIVATE_KEY` together, restart.
   - Changing `APPLE_KEY_ID` invalidates the cached client secret on its own
     (the cache is keyed by Key ID), so the next request mints a fresh one.
   - Replacing `APPLE_PRIVATE_KEY` **without** changing `APPLE_KEY_ID` leaves
     the old, still-cached secret in place for up to 180 days. Always change
     both, and restart regardless.
3. Verify 5.2. Then **revoke** the old key (two keys per App ID is the ceiling —
   you cannot create the third without revoking).

The Services ID is immutable in practice: a new Services ID means re-registering
domains and Return URLs, updating `APPLE_CLIENT_ID`, and — because `aud` is
checked — every ID token minted for the old services ID starts failing.

---

## 7. Separate credentials per environment (why)

- `verifyAppleToken` compares the ID token's `aud` against **this deployment's**
  `APPLE_CLIENT_ID`. Sharing one Services ID across staging and production
  would mean a production-issued token is accepted by staging and vice versa —
  the exact cross-client confusion the claim checks exist to stop.
- Google's `aud` is **not** checked (known gap, below). In the browser flow the
  blast radius is bounded — only our own code is exchanged, with our own client
  credentials, so Google returns an ID token for that client. The legacy
  `POST /auth/social/google` endpoint takes a client-supplied `idToken` and,
  with no `aud` check, would accept a token minted for _any_ Google client.
  Keeping those legacy endpoints off the public surface matters more than the
  console setup does; per-environment clients are not a substitute for the
  check.
- Staging is a Testing-status project with test users; production will need
  publishing/verification. Keep the projects apart so staging experiments can
  never affect production consent.

---

## 8. Turn it off / roll back

| Situation                                      | Action                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Provider outage, or bad credentials in staging | Flag off (step 4). Instant, no deploy, buttons disappear.                       |
| Need the endpoint dead regardless of flags     | Unset the provider's client ID/redirect URI and restart → authorize returns 503 |
| Bad deploy                                     | Restore the previous env values and restart; no data migration is involved      |

Unsetting credentials never breaks boot: a missing key produces a 503 at the
authorize endpoint, not a crash, and social vars are not in the shared env
validator.

---

## 9. Known gaps this runbook cannot close

Recorded in [audit.md](../../audit.md) §9.10 and
[prd-social-login.md](../product/prd-social-login.md); listed here so nobody
assumes the setup above covers them:

1. **Google `aud` is not checked.** `verifyGoogleToken` calls Google's
   `/tokeninfo` and accepts any token Google says is valid, without comparing
   `aud` to `GOOGLE_CLIENT_ID`. Any ID token minted for _any_ of our Google
   clients would be accepted. Mitigation today is per-environment clients
   (section 7) — not a code-level check.
2. **Google verification goes through `tokeninfo`,** which Google documents as
   debugging-grade and subject to throttling. A burst of staging sign-ins can
   produce `401 Google token invalid…` with valid tokens.
3. **The legacy direct-token endpoints** (`POST /auth/social/google` and
   `modules/social-auth`) still exist. The Apple direct-token route
   (`POST /auth/social/apple`) has been retired; Apple sign-in goes only through
   `/auth/social/apple/authorize` + `/callback`. The `modules/social-auth` variant
   verifies no signature at all. The browser never uses either; treat them as legacy.
4. **No live provider exchange is covered by automated tests.** The claim checks
   are proven against a generated keypair served as Apple's JWKS, which is
   cryptographic proof but not an end-to-end proof of the console settings.
5. **Apple emails.** Users who chose "Hide My Email" present
   `@privaterelay.appleid.com` addresses. Accounts are matched by `email`, and
   Apple's `email_verified` arrives as a **string or a boolean** — code reading
   it must accept both. Sending mail to relay addresses requires registering
   email sources with SPF/DKIM, which is out of scope here.

---

## 10. Sign-off checklist

Copy into the change ticket and tick each line:

- [ ] Staging web origin confirmed from the running app (not from a doc)
- [ ] Google: staging project, Audience = External/Testing, test users added
- [ ] Google: redirect URI registered exactly as `GOOGLE_REDIRECT_URI`
- [ ] Google: client ID + secret stored in Coolify (secret shown only once)
- [ ] Apple: primary App ID has Sign in with Apple enabled
- [ ] Apple: Services ID configured with domain `staging.azeeboplus.com` + Return URL
- [ ] Apple: `.p8` downloaded once and stored in the secret manager
- [ ] All eight keys set; auth service restarted
- [ ] `authorize?format=json` returns 200 for both providers, URL matches
- [ ] `auth_social_google` / `auth_social_apple` on
- [ ] Browser round trip completed for both providers in a private window
- [ ] Failure path rehearsed once (`?error=` code observed, no raw JSON)
- [ ] Secrets absent from git, logs, tickets and chat
