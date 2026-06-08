# Frontend Hook Integration Guide

## Overview

This document describes how the Azeebo+ frontend has been updated to use the new `useUniverses()` and `useSettings()` hooks for database-driven universes and system settings.

## Hooks Available

### `useUniverses()`

Fetches enabled universes from the database with their feature flags.

**Returns:**
- `universes` - Array of enabled universes
- `isLoading` - Loading state
- `error` - Error message if any
- `getUniverse(name)` - Get specific universe by name
- `isUniverseEnabled(name)` - Check if universe is enabled
- `hasFeature(universeName, featureKey)` - Check if feature is enabled for universe

### `useSettings()`

Fetches public system settings from the database.

**Returns:**
- `settings` - Settings as key-value object
- `isLoading` - Loading state
- `error` - Error message if any
- `getSetting(key, defaultValue)` - Get setting value with optional default

## Updated Components

### 1. SEO Component (`components/SeoMeta.tsx`)

**Before:**
```typescript
document.title = `${title} | Azeebo+`;
```

**After:**
```typescript
const { getSetting } = useSettings();
const siteName = getSetting('site_name', 'Azeebo+');
document.title = `${title} | ${siteName}`;
```

**Settings Used:**
- `site_name` - Platform name
- `seo_title` - Default SEO title

### 2. Onboarding Page (`app/onboarding/page.tsx`)

**Before:**
```typescript
const interests = [
  { id: 'reality', icon: '🎭', label: 'Reality TV' },
  // ... hardcoded list
];
```

**After:**
```typescript
const { universes, isLoading: universesLoading } = useUniverses();
// Dynamically render universes from database
universes.map((universe) => (
  <button key={universe.id} onClick={() => toggleInterest(universe.name)}>
    <span>{universe.icon}</span>
    <span>{universe.displayName}</span>
  </button>
))
```

**Benefits:**
- Universes can be added/removed from database without code changes
- Disabled universes won't appear in onboarding
- Icons and display names are database-driven

### 3. Home Page (`app/page.tsx`)

**Before:**
```typescript
<h1>Azeebo+</h1>
<p>Install Azeebo+</p>
<p>Join Azeebo+ today...</p>
```

**After:**
```typescript
const { getSetting } = useSettings();
const siteName = getSetting('site_name', 'Azeebo+');
<h1>{siteName}</h1>
<p>Install {siteName}</p>
<p>Join {siteName} today...</p>
```

**Settings Used:**
- `site_name` - Platform name

### 4. Reality Page (`app/reality/page.tsx`)

**Before:**
```typescript
useEffect(() => {
  // Always fetch reality content
}, []);
```

**After:**
```typescript
const { isUniverseEnabled, hasFeature } = useUniverses();
const { getSetting } = useSettings();
const siteName = getSetting('site_name', 'Azeebo+');
const isRealityEnabled = isUniverseEnabled('reality');

useEffect(() => {
  if (!isRealityEnabled) {
    setError('Reality universe is currently unavailable');
    return;
  }
  // Fetch content only if enabled
}, [isRealityEnabled]);
```

**Feature Flags Available:**
- `voting_enabled` - Show voting widgets
- `live_chat_enabled` - Show live chat
- `predictions_enabled` - Show predictions

**Benefits:**
- Gracefully handles disabled universes
- Can conditionally show features based on flags
- Site name is dynamic

### 5. Games Page (`app/games/page.tsx`)

**Before:**
```typescript
// Always show all game features
```

**After:**
```typescript
const { isUniverseEnabled, hasFeature } = useUniverses();
const { getSetting } = useSettings();
const siteName = getSetting('site_name', 'Azeebo+');
const isGamesEnabled = isUniverseEnabled('games');
const showStreaming = hasFeature('games', 'streaming_enabled');
const showTournaments = hasFeature('games', 'tournaments_enabled');

// Conditionally render features
{showStreaming && <StreamingSection />}
{showTournaments && <TournamentsSection />}
```

**Feature Flags Available:**
- `streaming_enabled` - Show game streaming
- `tournaments_enabled` - Show tournaments

**Benefits:**
- Features can be toggled without code changes
- Gradual rollout of new features
- Quick rollback if issues arise

### 6. Vertical Page (`app/vertical/page.tsx`)

**Before:**
```typescript
<h1>Azeebo+</h1>
// Always show all vertical content
```

**After:**
```typescript
const { isUniverseEnabled } = useUniverses();
const { getSetting } = useSettings();
const siteName = getSetting('site_name', 'Azeebo+');
const isVerticalEnabled = isUniverseEnabled('vertical');

// Check if universe is enabled before rendering
```

**Benefits:**
- Universe can be disabled without breaking the page
- Site name is dynamic

## Usage Examples

### Example 1: Check if Universe is Enabled

```typescript
import { useUniverses } from '@/hooks/useDatabase';

function MyComponent() {
  const { isUniverseEnabled, isLoading } = useUniverses();

  if (isLoading) return <div>Loading...</div>;

  if (!isUniverseEnabled('sports')) {
    return <div>Sports content is currently unavailable</div>;
  }

  return <SportsContent />;
}
```

### Example 2: Conditionally Show Feature

```typescript
import { useUniverses } from '@/hooks/useDatabase';

function RealityShowPage() {
  const { hasFeature } = useUniverses();

  return (
    <div>
      <VideoPlayer />
      {hasFeature('reality', 'voting_enabled') && <VotingWidget />}
      {hasFeature('reality', 'live_chat_enabled') && <LiveChat />}
    </div>
  );
}
```

### Example 3: Use Dynamic Site Name

```typescript
import { useSettings } from '@/hooks/useDatabase';

function Header() {
  const { getSetting, isLoading } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');

  if (isLoading) return <div>Loading...</div>;

  return (
    <header>
      <h1>{siteName}</h1>
      <p>{getSetting('site_tagline', 'Discover, Create, Engage')}</p>
    </header>
  );
}
```

### Example 4: Get SEO Settings

```typescript
import { useSettings } from '@/hooks/useDatabase';

function SEOComponent() {
  const { getSetting } = useSettings();

  const seoTitle = getSetting('seo_title', 'Default Title');
  const seoDescription = getSetting('seo_description', 'Default description');
  const seoKeywords = getSetting('seo_keywords', []);

  return (
    <Head>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords.join(', ')} />
    </Head>
  );
}
```

### Example 5: Get Social Media Handles

```typescript
import { useSettings } from '@/hooks/useDatabase';

function Footer() {
  const { getSetting } = useSettings();

  const twitter = getSetting('social_twitter', '@azeeboplus');
  const instagram = getSetting('social_instagram', '@azeeboplus');

  return (
    <footer>
      <a href={`https://twitter.com/${twitter}`}>Twitter</a>
      <a href={`https://instagram.com/${instagram}`}>Instagram</a>
    </footer>
  );
}
```

## Available Settings Keys

### General Settings
- `site_name` - Platform name
- `site_description` - Platform description
- `site_tagline` - Platform tagline
- `max_upload_size` - Maximum upload size in bytes
- `allowed_file_types` - Allowed file types array

### SEO Settings
- `seo_title` - Default SEO title
- `seo_description` - Default SEO description
- `seo_keywords` - Default SEO keywords array

### Social Settings
- `social_twitter` - Twitter handle
- `social_instagram` - Instagram handle
- `social_facebook` - Facebook page
- `social_youtube` - YouTube channel

### Contact Settings
- `contact_email` - Contact email
- `support_email` - Support email

### System Settings
- `maintenance_mode` - Maintenance mode flag
- `registration_enabled` - Registration enabled flag
- `creator_approval_required` - Creator approval required flag

## Available Universe Feature Flags

### Reality Universe
- `voting_enabled` - Enable voting widgets
- `live_chat_enabled` - Enable live chat
- `predictions_enabled` - Enable predictions

### Sports Universe
- `live_scores_enabled` - Show live scores
- `predictions_enabled` - Enable match predictions

### Games Universe
- `streaming_enabled` - Enable game streaming
- `tournaments_enabled` - Enable tournaments

## Best Practices

1. **Always Provide Defaults**
   ```typescript
   const siteName = getSetting('site_name', 'Azeebo+');
   ```

2. **Handle Loading States**
   ```typescript
   const { universes, isLoading } = useUniverses();
   if (isLoading) return <LoadingSpinner />;
   ```

3. **Check Universe Availability**
   ```typescript
   if (!isUniverseEnabled('reality')) {
     return <UnavailableMessage />;
   }
   ```

4. **Use Feature Flags for Conditional Rendering**
   ```typescript
   {hasFeature('reality', 'voting_enabled') && <VotingWidget />}
   ```

5. **Cache Settings on Client**
   - Settings are cached in React state
   - No need to manually cache
   - Re-fetch only when needed

## Migration Guide

### Step 1: Identify Hardcoded Values

Search for:
- Hardcoded "Azeebo+" strings
- Hardcoded universe names
- Hardcoded feature flags
- Hardcoded settings values

### Step 2: Import Hooks

```typescript
import { useUniverses, useSettings } from '@/hooks/useDatabase';
```

### Step 3: Replace Hardcoded Values

**Site Name:**
```typescript
// Before
<h1>Azeebo+</h1>

// After
const { getSetting } = useSettings();
const siteName = getSetting('site_name', 'Azeebo+');
<h1>{siteName}</h1>
```

**Universe Lists:**
```typescript
// Before
const universes = [{ name: 'reality', icon: '🎭' }];

// After
const { universes } = useUniverses();
```

**Feature Checks:**
```typescript
// Before
{showVoting && <VotingWidget />}

// After
const { hasFeature } = useUniverses();
{hasFeature('reality', 'voting_enabled') && <VotingWidget />}
```

### Step 4: Test

- Test with different universe configurations
- Test with disabled universes
- Test with different feature flags
- Test with different settings values

## Performance Considerations

1. **Caching**: Settings and universes are cached in React state
2. **Re-fetching**: Only re-fetches on component mount
3. **Loading States**: Always show loading states during fetch
4. **Error Handling**: Gracefully handle fetch errors with defaults

## Troubleshooting

### Settings Not Loading

**Problem:** Settings show default values
**Solution:**
- Check if settings are marked as public in database
- Verify API endpoint is accessible
- Check browser console for errors

### Universes Not Showing

**Problem:** Universes array is empty
**Solution:**
- Check if universes are enabled in database
- Verify seed data was inserted
- Check API response in network tab

### Feature Flags Not Working

**Problem:** `hasFeature()` always returns false
**Solution:**
- Check if feature flag exists in database
- Verify feature flag is enabled
- Check universe is enabled

## Future Enhancements

1. **Universe-Specific Settings**: Add settings per universe
2. **User Preferences**: Store user preferences in database
3. **A/B Testing**: Integrate feature flags with A/B testing
4. **Real-time Updates**: WebSocket for live setting updates
5. **Offline Support**: Cache settings in localStorage

## Conclusion

By using the `useUniverses()` and `useSettings()` hooks, the Azeebo+ frontend is now fully database-driven. Administrators can:
- Enable/disable universes without code changes
- Toggle features on/off with feature flags
- Update site settings through admin interface
- Manage SEO and social media settings dynamically

This provides maximum flexibility and allows the platform to adapt quickly to changing requirements.
