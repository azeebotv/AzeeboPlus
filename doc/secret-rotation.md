# Secret Rotation Guide

This document describes how to rotate secrets for Azeebo+ services running on Coolify.

## Prerequisites

- Access to Coolify dashboard
- Access to the server via SSH or Coolify terminal
- `kubectl` or `docker` CLI (if running outside Coolify)

---

## 1. JWT Secrets (JWT_ACCESS_SECRET / JWT_REFRESH_SECRET)

JWT secrets are used for access and refresh token signing. Rotating them invalidates all existing tokens.

### Steps

1. **Generate new secrets** (on your workstation or via Coolify terminal):
   ```bash
   openssl rand -base64 64
   ```
   Run this twice — once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`.

2. **Update in Coolify**:
   - Go to **Coolify Dashboard → Applications → auth-service → Environment Variables**
   - Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with the new values
   - Repeat for **any service that imports `@azeebo/auth`** (user-service, creator-service, etc.)

3. **Deploy**:
   - Trigger a redeploy of **auth-service first**, then all other services that use JWT verification
   - All connected users will be logged out and must re-authenticate

4. **Verify**:
   ```bash
   curl -s https://<your-domain>/v1/auth/health | jq .
   # Test login flow
   curl -X POST https://<your-domain>/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass"}'
   ```

> **Important**: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be different values. Never use the same secret for both.

---

## 2. Database Passwords (PostgreSQL)

Each service has its own database. Rotate passwords one service at a time to avoid downtime.

### Steps

1. **Generate a new password**:
   ```bash
   openssl rand -base64 32 | tr -d '/+=' | head -c 32
   ```

2. **Update the database password in PostgreSQL**:
   ```bash
   # Connect to the database container
   docker exec -it <postgres-container> psql -U postgres

   # In psql:
   ALTER USER azeebo_<service> WITH PASSWORD '<new-password>';
   \q
   ```

3. **Update `DATABASE_URL` in Coolify**:
   - Go to **Coolify Dashboard → Applications → <service> → Environment Variables**
   - Update `DATABASE_URL` with the new password:
     ```
     postgresql://azeebo_<service>:<new-password>@<host>:5432/azeebo_<service>
     ```

4. **Deploy the service**:
   - Redeploy the affected service
   - Monitor logs for connection errors:
     ```bash
     # In Coolify terminal or SSH:
     docker logs <service-container> --tail 50 -f
     ```

5. **Verify**:
   ```bash
   curl -s https://<your-domain>/v1/<service>/health | jq .
   ```

### Services and their databases

| Service | Database |
|---------|----------|
| auth-service | azeebo_auth |
| user-service | azeebo_user |
| wallet-service | azeebo_wallet |
| payment-service | azeebo_payment |
| content-service | azeebo_content |
| search-service | azeebo_search |
| notification-service | azeebo_notification |
| reward-service | azeebo_reward |
| analytics-service | azeebo_analytics |
| recommendation-service | azeebo_recommendation |
| reality-service | azeebo_reality |
| movie-service | azeebo_movie |
| comedy-service | azeebo_comedy |
| games-service | azeebo_games |
| queue-service | azeebo_queue |
| lifestyle-service | azeebo_lifestyle |
| vertical-service | azeebo_vertical |
| creator-service | azeebo_creator |
| support-service | azeebo_support |
| sports-service | azeebo_sports |
| moderation-service | azeebo_moderation |
| engagement-service | azeebo_engagement |
| messaging-service | azeebo_messaging |
| referral-service | azeebo_referral |
| subscription-service | azeebo_subscription |
| media-service | azeebo_media |
| api-gateway | azeebo_gateway |

---

## 3. Redis Password

Redis is shared across services. Changing the password requires updating all services that connect to Redis.

### Steps

1. **Generate a new password**:
   ```bash
   openssl rand -base64 32 | tr -d '/+=' | head -c 32
   ```

2. **Update Redis password**:
   ```bash
   # Connect to Redis container
   docker exec -it <redis-container> redis-cli

   # In redis-cli:
   CONFIG SET requirepass "<new-password>"
   CONFIG REWRITE
   EXIT
   ```

3. **Update `REDIS_URL` in Coolify**:
   - Go to **each application → Environment Variables**
   - Update `REDIS_URL` to:
     ```
     redis://:<new-password>@<redis-host>:6379
     ```
   - **All services** using Redis must be updated

4. **Deploy all services**:
   - Redeploy all services in order: queue-service first, then others
   - Monitor logs for Redis connection errors

5. **Verify**:
   ```bash
   docker exec -it <redis-container> redis-cli -a "<new-password>" PING
   # Should return: PONG
   ```

---

## 4. API Keys

### Paystack (Payment Service)

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings → API Keys & Tokens**
3. Generate new keys
4. Update in Coolify:
   - `PAYSTACK_SECRET_KEY` → payment-service
   - `PAYSTACK_PUBLIC_KEY` → web-app, mobile-app
5. Deploy affected services

### Twilio (Notification Service)

1. Log in to [Twilio Console](https://console.twilio.com)
2. Go to **Account → API keys** or **Console Dashboard** for Auth Token
3. Generate new API key / reset Auth Token
4. Update in Coolify:
   - `TWILIO_ACCOUNT_SID` → notification-service
   - `TWILIO_AUTH_TOKEN` → notification-service
   - `TWILIO_PHONE_NUMBER` → notification-service (if changed)
5. Deploy notification-service

### Firebase (Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Go to **Project Settings → Service accounts**
3. Click **Generate new private key**
4. Download the JSON file
5. Update in Coolify:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` → notification-service (paste the full JSON)
   - `FIREBASE_PROJECT_ID` → notification-service (if changed)
6. Deploy notification-service

> **Note**: Firebase service account keys are large JSON blobs. Use Coolify's "File" environment variable type if available, or ensure the entire JSON is on a single line when pasting.

---

## Post-Rotation Checklist

After rotating any secret:

- [ ] All affected services deployed successfully
- [ ] Health checks passing for all services
- [ ] No error spikes in monitoring
- [ ] Test critical user journeys (login, payment, notifications)
- [ ] Old secrets are no longer in use (verify no stale deployments)
- [ ] Update this document if rotation procedure changed
