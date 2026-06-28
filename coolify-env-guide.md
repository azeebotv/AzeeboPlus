# Coolify Nixpacks Deployment — Environment Variables Guide

## Step 1: PostgreSQL Service (Coolify managed)

Set these in the PostgreSQL service settings:
```
POSTGRES_USER=azeebo
POSTGRES_PASSWORD=<generate-a-strong-password>
POSTGRES_DB=azeebo_plus
```

Note the **internal hostname** Coolify assigns (e.g. `postgresql-xxxx`).

## Step 2: Redis Service (Coolify managed)

Set these in the Redis service settings:
```
REDIS_PASSWORD=<generate-a-strong-password>
```

Note the **internal hostname** Coolify assigns (e.g. `redis-xxxx`).

## Step 3: Run the init script manually

After PostgreSQL is running, SSH into your VPS and run:

```bash
docker exec -it <postgres-container-id> bash -c '
cat << "INITSQL" | psql -U azeebo -d azeebo_plus
-- Create databases and users for each service
DO $$
DECLARE
  db RECORD;
BEGIN
  FOR db IN
    SELECT
      s.db_name,
      s.db_user,
      s.db_password
  FROM (VALUES
    ('auth_db',        'auth_user',        '$(openssl rand -base64 24)'),
    ('user_db',        'user_user',        '$(openssl rand -base64 24)'),
    ('wallet_db',      'wallet_user',      '$(openssl rand -base64 24)'),
    ('payment_db',     'payment_user',     '$(openssl rand -base64 24)'),
    ('content_db',     'content_user',     '$(openssl rand -base64 24)'),
    ('search_db',      'search_user',      '$(openssl rand -base64 24)'),
    ('notification_db', 'notification_user', '$(openssl rand -base64 24)'),
    ('reward_db',      'reward_user',      '$(openssl rand -base64 24)'),
    ('analytics_db',   'analytics_user',   '$(openssl rand -base64 24)'),
    ('recommendation_db', 'recommendation_user', '$(openssl rand -base64 24)'),
    ('reality_db',     'reality_user',     '$(openssl rand -base64 24)'),
    ('movie_db',       'movie_user',       '$(openssl rand -base64 24)'),
    ('comedy_db',      'comedy_user',      '$(openssl rand -base64 24)'),
    ('games_db',       'games_user',       '$(openssl rand -base64 24)'),
    ('queue_db',       'queue_user',       '$(openssl rand -base64 24)'),
    ('lifestyle_db',   'lifestyle_user',   '$(openssl rand -base64 24)'),
    ('vertical_db',    'vertical_user',    '$(openssl rand -base64 24)'),
    ('creator_db',     'creator_user',     '$(openssl rand -base64 24)'),
    ('media_db',       'media_user',       '$(openssl rand -base64 24)'),
    ('support_db',     'support_user',     '$(openssl rand -base64 24)'),
    ('sports_db',      'sports_user',      '$(openssl rand -base64 24)'),
    ('moderation_db',  'moderation_user',  '$(openssl rand -base64 24)'),
    ('engagement_db',  'engagement_user',  '$(openssl rand -base64 24)'),
    ('messaging_db',   'messaging_user',   '$(openssl rand -base64 24)'),
    ('referral_db',    'referral_user',    '$(openssl rand -base64 24)'),
    ('subscription_db', 'subscription_user', '$(openssl rand -base64 24)'),
    ('admin_db',       'admin_user',       '$(openssl rand -base64 24)'),
    ('creator_portal_db', 'creator_portal_user', '$(openssl rand -base64 24)')
  ) AS s(db_name, db_user, db_password)
  LOOP
    EXECUTE format($f$
      CREATE USER %I WITH PASSWORD %L;
      CREATE DATABASE %I OWNER %I;
    $f$, db.db_user, db.db_password, db.db_name, db.db_user);
  END LOOP;
END
$$;
INITSQL
'
```

## Step 4: Environment Variables Per Service

### SHARED VALUES (use in all services)
Replace these placeholders in every service:
```
POSTGRES_HOST=<coolify-postgres-hostname>    # e.g. postgresql-xxxx
REDIS_HOST=<coolify-redis-hostname>          # e.g. redis-xxxx
REDIS_PASSWORD=<your-redis-password>
AUTH_DB_PASSWORD=<password-from-step-3>
USER_DB_PASSWORD=<password-from-step-3>
... etc.
```

### auth-service (port 3000)
```
NODE_ENV=production
PORT=3000
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://auth_user:<AUTH_DB_PASSWORD>@<POSTGRES_HOST>:5432/auth_db?schema=public
JWT_ACCESS_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### user-service (port 3001)
```
NODE_ENV=production
PORT=3001
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://user_user:<USER_DB_PASSWORD>@<POSTGRES_HOST>:5432/user_db?schema=public
```

### wallet-service (port 3002)
```
NODE_ENV=production
PORT=3002
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://wallet_user:<WALLET_DB_PASSWORD>@<POSTGRES_HOST>:5432/wallet_db?schema=public
```

### payment-service (port 3003)
```
NODE_ENV=production
PORT=3003
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://payment_user:<PAYMENT_DB_PASSWORD>@<POSTGRES_HOST>:5432/payment_db?schema=public
PAYSTACK_SECRET_KEY=<your-key>
PAYSTACK_WEBHOOK_SECRET=<your-webhook-secret>
FLW_SECRET_KEY=<your-key>
FLW_WEBHOOK_SECRET=<your-webhook-secret>
```

### content-service (port 3004)
```
NODE_ENV=production
PORT=3004
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://content_user:<CONTENT_DB_PASSWORD>@<POSTGRES_HOST>:5432/content_db?schema=public
```

### search-service (port 3005)
```
NODE_ENV=production
PORT=3005
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://search_user:<SEARCH_DB_PASSWORD>@<POSTGRES_HOST>:5432/search_db?schema=public
```

### notification-service (port 3006)
```
NODE_ENV=production
PORT=3006
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://notification_user:<NOTIFICATION_DB_PASSWORD>@<POSTGRES_HOST>:5432/notification_db?schema=public
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-pass>
EMAIL_FROM=<email-from>
SENDGRID_API_KEY=<your-sendgrid-api-key>
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
```

### reward-service (port 3007)
```
NODE_ENV=production
PORT=3007
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://reward_user:<REWARD_DB_PASSWORD>@<POSTGRES_HOST>:5432/reward_db?schema=public
```

### analytics-service (port 3008)
```
NODE_ENV=production
PORT=3008
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://analytics_user:<ANALYTICS_DB_PASSWORD>@<POSTGRES_HOST>:5432/analytics_db?schema=public
```

### recommendation-service (port 3009)
```
NODE_ENV=production
PORT=3009
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://recommendation_user:<RECOMMENDATION_DB_PASSWORD>@<POSTGRES_HOST>:5432/recommendation_db?schema=public
```

### reality-service (port 3010)
```
NODE_ENV=production
PORT=3010
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://reality_user:<REALITY_DB_PASSWORD>@<POSTGRES_HOST>:5432/reality_db?schema=public
```

### movie-service (port 3011)
```
NODE_ENV=production
PORT=3011
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://movie_user:<MOVIE_DB_PASSWORD>@<POSTGRES_HOST>:5432/movie_db?schema=public
```

### comedy-service (port 3012)
```
NODE_ENV=production
PORT=3012
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://comedy_user:<COMEDY_DB_PASSWORD>@<POSTGRES_HOST>:5432/comedy_db?schema=public
```

### api-gateway (port 3013)
```
NODE_ENV=production
PORT=3013
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
AUTH_SERVICE_URL=http://auth-service:3000
USER_SERVICE_URL=http://user-service:3001
WALLET_SERVICE_URL=http://wallet-service:3002
PAYMENT_SERVICE_URL=http://payment-service:3003
CONTENT_SERVICE_URL=http://content-service:3004
SEARCH_SERVICE_URL=http://search-service:3005
NOTIFICATION_SERVICE_URL=http://notification-service:3006
REWARD_SERVICE_URL=http://reward-service:3007
ANALYTICS_SERVICE_URL=http://analytics-service:3008
RECOMMENDATION_SERVICE_URL=http://recommendation-service:3009
REALITY_SERVICE_URL=http://reality-service:3010
MOVIE_SERVICE_URL=http://movie-service:3011
COMEDY_SERVICE_URL=http://comedy-service:3012
GAMES_SERVICE_URL=http://games-service:3014
QUEUE_SERVICE_URL=http://queue-service:3015
LIFESTYLE_SERVICE_URL=http://lifestyle-service:3016
VERTICAL_SERVICE_URL=http://vertical-service:3017
CREATOR_SERVICE_URL=http://creator-service:3018
MEDIA_SERVICE_URL=http://media-service:3019
SUPPORT_SERVICE_URL=http://support-service:3020
SPORTS_SERVICE_URL=http://sports-service:3021
MODERATION_SERVICE_URL=http://moderation-service:3022
ENGAGEMENT_SERVICE_URL=http://engagement-service:3023
MESSAGING_SERVICE_URL=http://messaging-service:3024
REFERRAL_SERVICE_URL=http://referral-service:3025
SUBSCRIPTION_SERVICE_URL=http://subscription-service:3026
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://your-domain.com
```

### games-service (port 3014)
```
NODE_ENV=production
PORT=3014
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://games_user:<GAMES_DB_PASSWORD>@<POSTGRES_HOST>:5432/games_db?schema=public
```

### queue-service (port 3015)
```
NODE_ENV=production
PORT=3015
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://queue_user:<QUEUE_DB_PASSWORD>@<POSTGRES_HOST>:5432/queue_db?schema=public
```

### lifestyle-service (port 3016)
```
NODE_ENV=production
PORT=3016
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://lifestyle_user:<LIFESTYLE_DB_PASSWORD>@<POSTGRES_HOST>:5432/lifestyle_db?schema=public
```

### vertical-service (port 3017)
```
NODE_ENV=production
PORT=3017
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://vertical_user:<VERTICAL_DB_PASSWORD>@<POSTGRES_HOST>:5432/vertical_db?schema=public
```

### creator-service (port 3018)
```
NODE_ENV=production
PORT=3018
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://creator_user:<CREATOR_DB_PASSWORD>@<POSTGRES_HOST>:5432/creator_db?schema=public
```

### media-service (port 3019)
```
NODE_ENV=production
PORT=3019
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://media_user:<MEDIA_DB_PASSWORD>@<POSTGRES_HOST>:5432/media_db?schema=public
AWS_REGION=<aws-region>
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
AWS_S3_BUCKET=<aws-bucket>
```

### support-service (port 3020)
```
NODE_ENV=production
PORT=3020
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://support_user:<SUPPORT_DB_PASSWORD>@<POSTGRES_HOST>:5432/support_db?schema=public
```

### sports-service (port 3021)
```
NODE_ENV=production
PORT=3021
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://sports_user:<SPORTS_DB_PASSWORD>@<POSTGRES_HOST>:5432/sports_db?schema=public
```

### moderation-service (port 3022)
```
NODE_ENV=production
PORT=3022
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://moderation_user:<MODERATION_DB_PASSWORD>@<POSTGRES_HOST>:5432/moderation_db?schema=public
```

### engagement-service (port 3023)
```
NODE_ENV=production
PORT=3023
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://engagement_user:<ENGAGEMENT_DB_PASSWORD>@<POSTGRES_HOST>:5432/engagement_db?schema=public
```

### messaging-service (port 3024)
```
NODE_ENV=production
PORT=3024
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://messaging_user:<MESSAGING_DB_PASSWORD>@<POSTGRES_HOST>:5432/messaging_db?schema=public
```

### referral-service (port 3025)
```
NODE_ENV=production
PORT=3025
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://referral_user:<REFERRAL_DB_PASSWORD>@<POSTGRES_HOST>:5432/referral_db?schema=public
```

### subscription-service (port 3026)
```
NODE_ENV=production
PORT=3026
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://subscription_user:<SUBSCRIPTION_DB_PASSWORD>@<POSTGRES_HOST>:5432/subscription_db?schema=public
```

### admin-app (port 4016)
```
NODE_ENV=production
PORT=4016
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://admin_user:<ADMIN_DB_PASSWORD>@<POSTGRES_HOST>:5432/admin_db?schema=public
```

### creator-portal-app (port 4014)
```
NODE_ENV=production
PORT=4014
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379
DATABASE_URL=postgresql://creator_portal_user:<CREATOR_PORTAL_DB_PASSWORD>@<POSTGRES_HOST>:5432/creator_portal_db?schema=public
```

### web-app (port 4000)
```
NODE_ENV=production
PORT=4000
API_GATEWAY_URL=http://api-gateway:3013
NEXT_PUBLIC_API_URL=https://your-domain.com
```

## Step 5: Run Prisma migrations

After all databases are created and apps are deployed, run migrations via SSH:

```bash
# For each service, SSH into the running container and run:
docker exec -it <container-id> pnpm --filter @azeebo/<service-name> prisma:deploy
```

Or run all at once:
```bash
for service in auth-service user-service wallet-service payment-service content-service search-service notification-service reward-service analytics-service recommendation-service reality-service movie-service comedy-service games-service queue-service lifestyle-service vertical-service creator-service media-service support-service sports-service moderation-service engagement-service messaging-service referral-service subscription-service admin-app creator-portal-app; do
  echo "Migrating $service..."
  docker exec -it <container-id-for-$service> pnpm --filter @azeebo/$service prisma:deploy
done
```
