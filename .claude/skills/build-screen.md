# Skill: Build Screen

> Generate a complete screen with all states, analytics, and tests.

---

## Usage

```
/build-screen [Universe] [Screen Name]

Example:
/build-screen Reality VoteScreen
/build-screen Creator CreatorDashboard
/build-screen Games GameplayPage
```

## What It Does

1. Reads the screen specification from the product doc
2. Identifies which shared components to reuse from `/packages/ui`
3. Generates the screen with all 4 states
4. Adds analytics events
5. Creates the Prisma query/service if needed
6. Generates unit tests

## Output

- React Native screen file with loading/empty/error/success states
- Service method (if backend changes needed)
- Analytics event calls
- Unit test file
- List of new components created vs reused

## Template

```markdown
# Building: [Universe] - [Screen Name]

## Reused Components
- [ ] Component from /packages/ui

## New Components Needed
- [ ] NewComponent — [description]

## Screen States
- Loading: [description]
- Empty: [description]
- Error: [description]
- Success: [description]

## Analytics Events
- [universe]_[screen]_viewed
- [universe]_[action]_tapped
- [universe]_[action]_success
- [universe]_[action]_failure

## Files to Create/Modify
1. apps/mobile/src/screens/[universe]/[ScreenName].tsx
2. services/universes/[universe]-service/src/[module]/[module].service.ts (if needed)
3. apps/mobile/src/screens/[universe]/__tests__/[ScreenName].test.tsx
```
