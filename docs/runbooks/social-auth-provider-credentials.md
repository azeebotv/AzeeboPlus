# Runbook: Social Sign-In Provider Credentials (Staging & Production)

> Registering, configuring, verifying, publishing, and rotating Google and Apple OAuth
> credentials for "Continue with Google / Apple" across **Staging** and **Production**.

Related: [prd-social-login.md](../product/prd-social-login.md) · `services/core/auth-service/src/modules/auth/social/` · [DECISION-LOG.md](../program/DECISION-LOG.md) (D-03)

---

## 0. Fundamental Architecture & Invariants

Five independent requirements must be satisfied for social sign-in to succeed in any environment:

| # | Requirement | Where it is set |
| :-: | :--- | :--- |
| **1** | Dedicated Provider Credentials (client ID + secret; for Apple, team/key/`.p8`) | Provider developer consoles; strictly isolated per environment |
| **2** | Redirect URI registered **byte-identically** in provider console | `GOOGLE_REDIRECT_URI` / `APPLE_REDIRECT_URI` |
| **3** | Redirect URI targets the **Web App Callback**, never direct API host | Staging: `https://staging.azeeboplus.com/auth/callback`<br>Production: `https://azeeboplus.com/auth/callback` |
| **4** | Provider Kill Switches active | Feature flags: `auth_social_google` / `auth_social_apple` |
| **5** | Public HTTPS and valid TLS certificate | Edge reverse proxy / DNS records |

### The Authoritative Environment Variables (8 Keys)
From `services/core/auth-service/.env.example`:
```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

APPLE_CLIENT_ID=        # Services ID (e.g. com.azeebo.plus.staging / com.azeebo.plus.web)
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=      # Full PEM or single line with literal \n (.p8 file contents)
APPLE_REDIRECT_URI=
```
*Note: There is deliberately NO `APPLE_CLIENT_SECRET`. The auth service signs an ES256 client secret JWT dynamically using `apple-client-secret.service.ts` and caches it in-process for 180 days.*

---

## 1. Staging Setup Guide

### 1.1 Staging Topology & Addresses
- **Web App Origin:** `https://staging.azeeboplus.com`
- **API Gateway:** `https://staging-api.azeeboplus.com`
- **Provider Redirect URI:** `https://staging.azeeboplus.com/auth/callback`
- **Internal Web-to-API Exchange:** `POST https://staging-api.azeeboplus.com/api/v1/auth/social/callback`

### 1.2 Google Staging Client
1. Open [Google Cloud Console](https://console.cloud.google.com) and create or select a dedicated **Staging Project**.
2. **Audience / OAuth Consent Screen:**
   - User Type: External
   - Publishing Status: **Testing**
   - Test Users: Add internal QA and test accounts (up to 100 users).
3. **Clients → Create Credentials → OAuth Client ID:**
   - Application Type: Web application
   - Name: `Azeebo+ Web (Staging)`
   - Authorised JavaScript Origins: `https://staging.azeeboplus.com`
   - Authorised Redirect URIs:
     ```text
     https://staging.azeeboplus.com/auth/callback
     http://localhost:4000/auth/callback  # Local developer testing only
     ```
4. Save Client ID and Client Secret in Coolify Staging Secrets.

### 1.3 Apple Staging Services ID & `.p8` Key
1. In [Apple Developer Portal](https://developer.apple.com), select the Primary App ID (`com.azeebo.plus`).
2. **Identifiers → Services IDs → Add:**
   - Description: `Azeebo+ Staging Web Auth`
   - Identifier: `com.azeebo.plus.staging`
   - Enable **Sign in with Apple** → Configure:
     - Primary App ID: `com.azeebo.plus`
     - Domains: `staging.azeeboplus.com`
     - Return URLs: `https://staging.azeeboplus.com/auth/callback`
3. **Keys → Create Key:**
   - Enable **Sign in with Apple** → Configure with Primary App ID.
   - Download `.p8` key once and record the 10-character `Key ID` and `Team ID`.

---

## 2. Production Setup Guide

### 2.1 Production Topology & Addresses
- **Web App Origin:** `https://azeeboplus.com`
- **API Gateway:** `https://api.azeeboplus.com`
- **Provider Redirect URI:** `https://azeeboplus.com/auth/callback`

### 2.2 Google Production Client
1. Use a separate **Production Google Cloud Project**. Never mix production redirect URIs into staging projects.
2. **Publishing Status:** Move from *Testing* to **In Production (Publish App)**.
   - For identity scopes (`openid`, `email`, `profile`), Google does not require sensitive-scope verification.
   - Complete Google Auth Platform Branding with official app logo, privacy policy URL (`https://azeeboplus.com/privacy`), and terms URL (`https://azeeboplus.com/terms`).
3. **OAuth Client ID:**
   - Authorised Redirect URI:
     ```text
     https://azeeboplus.com/auth/callback
     ```
4. Store Client ID and Secret in production secret manager.

### 2.3 Apple Production Services ID & `.p8` Key
1. **Identifiers → Services IDs:**
   - Identifier: `com.azeebo.plus.web`
   - Domains: `azeeboplus.com`
   - Return URL: `https://azeeboplus.com/auth/callback`
2. **Keys:** Create production Sign in with Apple Key (or share primary App ID production key).
   - Save `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY` in production secrets.

---

## 3. Feature Flags & Kill Switches

Both Google and Apple login buttons and callback exchanges are gated behind feature flags:
- `auth_social_google` (default: `true`)
- `auth_social_apple` (default: `true`)

To disable immediately in an emergency:
```bash
# Disable Google Sign-In via Redis
redis-cli -u "$REDIS_URL" SET feature_flags:auth_social_google '{"key":"auth_social_google","enabled":false}'

# Disable Apple Sign-In via Redis
redis-cli -u "$REDIS_URL" SET feature_flags:auth_social_apple '{"key":"auth_social_apple","enabled":false}'
```

---

## 4. Verification & Automated Test Commands

Run the test suite to verify OAuth route parsing, form post handling, and token generation:
```bash
# Web callback unit and boundary tests
pnpm --filter @azeebo/web test src/app/auth/callback/__tests__/route.test.ts

# Auth provider button flag-gating tests
pnpm --filter @azeebo/web test src/app/__tests__/auth-provider-buttons.test.tsx

# Auth service token exchange tests
pnpm --filter @azeebo/auth-service test
```

---

## 5. Secret Rotation Procedures

### Rotating Google Client Secret
1. In Google Cloud Console, open the OAuth Client and click **Add Secret**.
2. Deploy the new secret to `GOOGLE_CLIENT_SECRET` in secret manager.
3. Restart `auth-service`.
4. Delete the old secret in Google Cloud Console once traffic migrates.

### Rotating Apple `.p8` Private Key
1. Create a new key in Apple Developer Portal (maximum 2 active keys allowed).
2. Update `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY` in secret manager.
3. Restart `auth-service` (the service detects the key change and clears the cached client secret).
4. Revoke the old key in Apple Developer Portal.
