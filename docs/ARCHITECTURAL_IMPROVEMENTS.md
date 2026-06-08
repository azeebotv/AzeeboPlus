# Architectural Improvements Implementation

## Overview

This document describes the implementation of three major architectural improvements to the Azeebo+ platform:

1. **Database-Driven Universes with Feature Flags** - Making all universes configurable via database
2. **Database-Driven System Settings** - Replacing hardcoded configuration with database-driven settings
3. **Enhanced Admin Interface** - New admin pages for managing universes and settings

## 1. Database-Driven Universes with Feature Flags

### Schema Changes

Enhanced the `Universe` model in `services/content-service/prisma/schema.prisma`:

```prisma
model Universe {
  id          String   @id @default(uuid())
  name        String   @unique
  displayName String
  description String?
  icon        String?
  color       String?
  isEnabled   Boolean  @default(true)      // NEW: Enable/disable universe
  sortOrder   Int      @default(0)         // NEW: Display order
  metadata    Json?                        // NEW: Flexible metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contentItems ContentItem[]
  passes       Pass[]
  featureFlags UniverseFeatureFlag[]       // NEW: Feature flags relation
}
```

Added new `UniverseFeatureFlag` model:

```prisma
model UniverseFeatureFlag {
  id          String   @id @default(uuid())
  universeId  String
  featureKey  String   // e.g., "voting_enabled", "predictions_enabled"
  isEnabled   Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  universe    Universe  @relation(fields: [universeId], references: [id], onDelete: Cascade)

  @@map("universe_feature_flags")
  @@unique([universeId, featureKey])
}
```

### Backend Implementation

**Files Created:**
- `apps/admin/src/modules/universe-management/universe-management.service.ts`
- `apps/admin/src/modules/universe-management/universe-management.controller.ts`
- `apps/admin/src/modules/universe-management/universe-management.module.ts`
- `apps/admin/src/modules/universe-management/dto/create-universe.dto.ts`
- `apps/admin/src/modules/universe-management/dto/update-universe.dto.ts`
- `apps/admin/src/modules/universe-management/dto/universe-feature-flag.dto.ts`

**API Endpoints:**

Admin endpoints (require admin authentication):
- `GET /v1/admin/universes` - Get all universes
- `GET /v1/admin/universes/enabled` - Get only enabled universes
- `GET /v1/admin/universes/:id` - Get universe by ID
- `GET /v1/admin/universes/name/:name` - Get universe by name
- `POST /v1/admin/universes` - Create new universe
- `PUT /v1/admin/universes/:id` - Update universe
- `DELETE /v1/admin/universes/:id` - Delete universe
- `PUT /v1/admin/universes/:id/toggle` - Enable/disable universe
- `PUT /v1/admin/universes/:id/feature-flags` - Update/create feature flag
- `DELETE /v1/admin/universes/:id/feature-flags/:featureKey` - Delete feature flag
- `GET /v1/admin/universes/check/:universeName/:featureKey` - Check if feature is enabled

Public endpoints (no authentication required):
- `GET /v1/public/universes` - Get all enabled universes with active feature flags
- `GET /v1/public/universes/:name/features` - Get features for specific universe

### Frontend Implementation

**Admin UI:**
- `apps/web/src/app/admin/universes/page.tsx` - Universe management interface
  - Create/edit/delete universes
  - Enable/disable universes
  - Manage feature flags
  - View content count per universe

**React Hooks:**
- `apps/web/src/hooks/useDatabase.ts` - `useUniverses()` hook
  - Fetch enabled universes
  - Check if universe is enabled
  - Check if feature is enabled for universe

## 2. Database-Driven System Settings

### Schema Changes

Added new `SystemSettings` model in `services/content-service/prisma/schema.prisma`:

```prisma
model SystemSettings {
  id          String   @id @default(uuid())
  key         String   @unique // e.g., "site_name", "seo_title"
  value       Json     // Flexible JSON value
  category    String   @default("general") // general, seo, social, email
  description String?
  isPublic    Boolean  @default(false) // Public settings accessible by non-admin
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("system_settings")
  @@index([category])
  @@index([isPublic])
}
```

### Backend Implementation

**Files Created:**
- `apps/admin/src/modules/system-settings/system-settings.service.ts`
- `apps/admin/src/modules/system-settings/system-settings.controller.ts`
- `apps/admin/src/modules/system-settings/system-settings.module.ts`
- `apps/admin/src/modules/system-settings/dto/create-setting.dto.ts`
- `apps/admin/src/modules/system-settings/dto/update-setting.dto.ts`

**API Endpoints:**

Admin endpoints (require admin authentication):
- `GET /v1/admin/settings` - Get all settings
- `GET /v1/admin/settings/public` - Get public settings
- `GET /v1/admin/settings/map` - Get settings as key-value map
- `GET /v1/admin/settings/category/:category` - Get settings by category
- `GET /v1/admin/settings/:key` - Get setting by key
- `GET /v1/admin/settings/value/:key` - Get setting value only
- `POST /v1/admin/settings` - Create new setting
- `POST /v1/admin/settings/bulk` - Bulk create settings
- `PUT /v1/admin/settings/:key` - Update setting
- `PUT /v1/admin/settings/bulk` - Bulk update settings
- `DELETE /v1/admin/settings/:key` - Delete setting

Public endpoints (no authentication required):
- `GET /v1/public/settings` - Get all public settings as key-value map
- `GET /v1/public/settings/:key` - Get specific public setting

### Frontend Implementation

**Admin UI:**
- `apps/web/src/app/admin/settings/page.tsx` - System settings management
  - Create/edit/delete settings
  - Filter by category
  - Toggle public/private visibility
  - Support for JSON values
  - Bulk operations

**React Hooks:**
- `apps/web/src/hooks/useDatabase.ts` - `useSettings()` hook
  - Fetch public settings
  - Get setting by key with default value

## 3. Enhanced Admin Interface

### New Admin Pages

1. **Universe Management** (`/admin/universes`)
   - Grid view of all universes
   - Quick enable/disable toggle
   - Feature flag management modal
   - Content count display
   - Color-coded universe cards

2. **System Settings** (`/admin/settings`)
   - Category-based filtering
   - JSON value support
   - Public/private toggle
   - Inline editing
   - Bulk operations

### Updated Navigation

Added "Universes" link to admin sidebar in `apps/web/src/app/admin/page.tsx`.

## 4. Database Migration & Seeding

### Migration Steps

1. Run Prisma migration:
```bash
cd services/content-service
npx prisma migrate dev --name add_universe_features_and_system_settings
```

2. Apply migration to production:
```bash
npx prisma migrate deploy
```

### Seeding

Created `prisma/seed/universes-settings.sql` with default data:

**Default Universes:**
- Reality Shows (with voting, live chat, predictions features)
- Sports (with live scores, predictions features)
- Games (with streaming, tournaments features)
- Comedy
- Lifestyle
- Movies
- Vertical
- Creators

**Default Settings:**
- General: site_name, site_description, site_tagline, max_upload_size, allowed_file_types
- SEO: seo_title, seo_description, seo_keywords
- Social: social_twitter, social_instagram, social_facebook, social_youtube
- Contact: contact_email, support_email
- System: maintenance_mode, registration_enabled, creator_approval_required

To seed the database:
```bash
psql -U <username> -d <database> -f prisma/seed/universes-settings.sql
```

## 5. API Client Updates

Enhanced `apps/web/src/lib/api.ts` with new methods:

**Universe Management:**
- `getAllUniverses()`
- `getUniverseById(id)`
- `getUniverseByName(name)`
- `createUniverse(data)`
- `updateUniverse(id, data)`
- `deleteUniverse(id)`
- `toggleUniverse(id, isEnabled)`
- `updateFeatureFlag(universeId, data)`
- `deleteFeatureFlag(universeId, featureKey)`
- `checkFeatureFlag(universeName, featureKey)`

**System Settings:**
- `getAllSettings()`
- `getPublicSettings()`
- `getSettingsMap()`
- `getSettingsByCategory(category)`
- `getSettingByKey(key)`
- `getSettingValue(key)`
- `createSetting(data)`
- `updateSetting(key, data)`
- `deleteSetting(key)`
- `bulkCreateSettings(settings)`
- `bulkUpdateSettings(settings)`

## Usage Examples

### Using Universes in Components

```typescript
import { useUniverses } from '@/hooks/useDatabase';

function MyComponent() {
  const { universes, isLoading, isUniverseEnabled, hasFeature } = useUniverses();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {universes.map(universe => (
        <div key={universe.id}>
          <h3>{universe.displayName}</h3>
          {hasFeature(universe.name, 'voting_enabled') && (
            <button>Vote Now</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Using Settings in Components

```typescript
import { useSettings } from '@/hooks/useDatabase';

function Header() {
  const { getSetting, isLoading } = useSettings();

  if (isLoading) return <div>Loading...</div>;

  return (
    <header>
      <h1>{getSetting('site_name', 'Azeebo+')}</h1>
      <p>{getSetting('site_tagline', 'Discover, Create, Engage')}</p>
    </header>
  );
}
```

### Checking Feature Flags

```typescript
import { useUniverses } from '@/hooks/useDatabase';

function RealityShowPage() {
  const { hasFeature, isUniverseEnabled } = useUniverses();

  const showVoting = hasFeature('reality', 'voting_enabled');
  const showLiveChat = hasFeature('reality', 'live_chat_enabled');
  const isRealityEnabled = isUniverseEnabled('reality');

  return (
    <div>
      {isRealityEnabled && (
        <>
          {showVoting && <VotingWidget />}
          {showLiveChat && <LiveChat />}
        </>
      )}
    </div>
  );
}
```

## Benefits

1. **Flexibility**: Universes and features can be enabled/disabled without code changes
2. **Configurability**: System settings can be managed through admin interface
3. **Scalability**: Easy to add new universes and features
4. **Safety**: Feature flags allow gradual rollout and quick rollback
5. **Performance**: Public settings cached on frontend reduce API calls
6. **Type Safety**: TypeScript interfaces ensure type correctness

## Testing

### Backend Tests

Run admin service tests:
```bash
cd apps/admin
npm test
```

### Frontend Tests

Test the admin interfaces:
```bash
cd apps/web
npm run dev
# Navigate to /admin/universes and /admin/settings
```

### API Tests

Test public endpoints:
```bash
curl http://localhost:3013/v1/public/universes
curl http://localhost:3013/v1/public/settings
```

## Future Enhancements

1. **Universe-specific settings**: Add universe-level settings in addition to global settings
2. **Feature flag conditions**: Add conditional feature flags based on user segments
3. **Settings validation**: Add JSON schema validation for settings values
4. **Settings history**: Track changes to settings over time
5. **Universe templates**: Pre-configured universe templates for quick setup
6. **A/B testing**: Integrate feature flags with A/B testing framework

## Conclusion

These architectural improvements provide a solid foundation for a flexible, configurable platform that can adapt to changing requirements without code changes. The database-driven approach ensures that administrators have full control over the platform's features and settings through an intuitive admin interface.
