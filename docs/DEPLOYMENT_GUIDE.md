# Deployment Guide - Architectural Improvements

## Prerequisites

- PostgreSQL database with Prisma migrations applied
- Node.js 18+ installed
- pnpm package manager
- Access to admin panel

## Step 1: Database Migration

### 1.1 Apply Schema Changes

```bash
cd services/content-service
npx prisma migrate dev --name add_universe_features_and_system_settings
```

For production:
```bash
npx prisma migrate deploy
```

### 1.2 Seed Default Data

```bash
psql -U your_username -d your_database -f prisma/seed/universes-settings.sql
```

Or using Prisma Studio:
```bash
cd services/content-service
npx prisma studio
```

Then manually add universes and settings through the UI.

## Step 2: Build and Deploy Admin Service

### 2.1 Install Dependencies

```bash
cd apps/admin
pnpm install
```

### 2.2 Build

```bash
pnpm build
```

### 2.3 Deploy

```bash
# Using PM2
pm2 restart admin-service

# Or using systemd
systemctl restart azeebo-admin

# Or using Docker
docker build -t azeebo-admin .
docker run -d -p 3014:3014 azeebo-admin
```

## Step 3: Build and Deploy Content Service

### 3.1 Install Dependencies

```bash
cd services/content-service
pnpm install
```

### 3.2 Build

```bash
pnpm build
```

### 3.3 Deploy

```bash
# Using PM2
pm2 restart content-service

# Or using systemd
systemctl restart azeebo-content

# Or using Docker
docker build -t azeebo-content .
docker run -d -p 3013:3013 azeebo-content
```

## Step 4: Build and Deploy Web App

### 4.1 Install Dependencies

```bash
cd apps/web
pnpm install
```

### 4.2 Build

```bash
pnpm build
```

### 4.3 Deploy

```bash
# Using PM2
pm2 restart web-app

# Or using Vercel/Netlify
vercel deploy --prod

# Or using Docker
docker build -t azeebo-web .
docker run -d -p 3000:3000 azeebo-web
```

## Step 5: Verify Deployment

### 5.1 Check Admin Service Health

```bash
curl http://localhost:3014/health
```

### 5.2 Check Content Service Health

```bash
curl http://localhost:3013/health
```

### 5.3 Test Public API Endpoints

```bash
# Get enabled universes
curl http://localhost:3013/v1/public/universes

# Get public settings
curl http://localhost:3013/v1/public/settings
```

### 5.4 Test Admin Endpoints

```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:3014/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@azeebo.com","password":"your_password"}' \
  | jq -r '.access_token')

# Get all universes
curl http://localhost:3014/v1/admin/universes \
  -H "Authorization: Bearer $TOKEN"

# Get all settings
curl http://localhost:3014/v1/admin/settings \
  -H "Authorization: Bearer $TOKEN"
```

### 5.5 Test Admin UI

1. Navigate to `http://localhost:3000/admin`
2. Login with admin credentials
3. Click on "Universes" in sidebar
4. Verify universe management interface loads
5. Click on "Settings" in sidebar
6. Verify settings management interface loads

## Step 6: Configure Universes

### 6.1 Review Default Universes

Navigate to `/admin/universes` and review the seeded universes:
- Reality Shows
- Sports
- Games
- Comedy
- Lifestyle
- Movies
- Vertical
- Creators

### 6.2 Enable/Disable Universes

Toggle universes on/off based on your platform's needs.

### 6.3 Configure Feature Flags

For each universe, configure feature flags:
- Reality: voting_enabled, live_chat_enabled, predictions_enabled
- Sports: live_scores_enabled, predictions_enabled
- Games: streaming_enabled, tournaments_enabled

## Step 7: Configure System Settings

### 7.1 Review Default Settings

Navigate to `/admin/settings` and review:
- General settings (site name, description, etc.)
- SEO settings
- Social media handles
- Contact emails
- System settings (maintenance mode, registration, etc.)

### 7.2 Update Platform-Specific Settings

Update the following for your deployment:
- `site_name` - Your platform name
- `site_description` - Platform description
- `seo_title` - Default SEO title
- `seo_description` - Default SEO description
- `contact_email` - Contact email
- `support_email` - Support email
- `social_*` - Social media handles

### 7.3 Configure Platform Features

- `maintenance_mode` - Set to `true` during maintenance
- `registration_enabled` - Enable/disable new user registrations
- `creator_approval_required` - Require approval for new creators

## Step 8: Update Frontend Code

### 8.1 Replace Hardcoded Universes

Find and replace hardcoded universe definitions in your code:

**Before:**
```typescript
const universes = [
  { name: 'reality', displayName: 'Reality Shows', icon: '🎭' },
  { name: 'sports', displayName: 'Sports', icon: '⚽' },
  // ...
];
```

**After:**
```typescript
import { useUniverses } from '@/hooks/useDatabase';

function MyComponent() {
  const { universes, isLoading } = useUniverses();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {universes.map(universe => (
        <UniverseCard key={universe.id} universe={universe} />
      ))}
    </div>
  );
}
```

### 8.2 Replace Hardcoded Settings

Find and replace hardcoded settings:

**Before:**
```typescript
const siteName = 'Azeebo+';
const siteDescription = 'The ultimate entertainment platform';
```

**After:**
```typescript
import { useSettings } from '@/hooks/useDatabase';

function Header() {
  const { getSetting, isLoading } = useSettings();

  if (isLoading) return <LoadingSpinner />;

  return (
    <header>
      <h1>{getSetting('site_name', 'Azeebo+')}</h1>
      <p>{getSetting('site_description', 'Default description')}</p>
    </header>
  );
}
```

### 8.3 Add Feature Flag Checks

Add feature flag checks before showing universe-specific features:

**Before:**
```typescript
function RealityShowPage() {
  return (
    <div>
      <VotingWidget />
      <LiveChat />
    </div>
  );
}
```

**After:**
```typescript
import { useUniverses } from '@/hooks/useDatabase';

function RealityShowPage() {
  const { hasFeature, isUniverseEnabled } = useUniverses();

  if (!isUniverseEnabled('reality')) {
    return <div>Reality shows are currently unavailable</div>;
  }

  return (
    <div>
      {hasFeature('reality', 'voting_enabled') && <VotingWidget />}
      {hasFeature('reality', 'live_chat_enabled') && <LiveChat />}
    </div>
  );
}
```

## Step 9: Monitor and Test

### 9.1 Monitor Logs

```bash
# Admin service logs
pm2 logs admin-service

# Content service logs
pm2 logs content-service

# Web app logs
pm2 logs web-app
```

### 9.2 Test User Flows

1. **Public User Flow:**
   - Visit homepage
   - Verify enabled universes are displayed
   - Check that disabled universes are hidden
   - Verify feature flags work correctly

2. **Admin User Flow:**
   - Login to admin panel
   - Create a new universe
   - Add feature flags
   - Toggle universe on/off
   - Verify changes reflect on public site

3. **Settings Flow:**
   - Update site name in settings
   - Verify change appears on public site
   - Update SEO settings
   - Verify meta tags in page source

### 9.3 Performance Testing

Monitor API response times:
```bash
# Test public universes endpoint
time curl http://localhost:3013/v1/public/universes

# Test public settings endpoint
time curl http://localhost:3013/v1/public/settings
```

Expected response times: < 100ms

## Rollback Plan

If issues arise:

1. **Database Rollback:**
```bash
cd services/content-service
npx prisma migrate rollback
```

2. **Service Rollback:**
```bash
# Restart previous versions
pm2 restart all --update-env
```

3. **Code Rollback:**
```bash
git revert <commit-hash>
git push
```

## Troubleshooting

### Issue: Universes not loading

**Solution:**
- Check database connection
- Verify migration was applied
- Check if seed data was inserted
- Review admin service logs

### Issue: Feature flags not working

**Solution:**
- Verify UniverseFeatureFlag relation in schema
- Check if feature flags exist in database
- Verify API endpoint is accessible
- Check browser console for errors

### Issue: Settings not updating

**Solution:**
- Clear browser cache
- Check if settings are marked as public
- Verify API endpoint permissions
- Review admin service logs

## Next Steps

1. Monitor platform performance
2. Gather admin feedback
3. Add more feature flags as needed
4. Expand system settings
5. Consider adding universe-specific settings
6. Implement A/B testing with feature flags

## Support

For issues or questions:
- Check logs: `pm2 logs`
- Review documentation: `docs/ARCHITECTURAL_IMPROVEMENTS.md`
- Check database: `npx prisma studio`
- Contact support: support@azeebo.com
