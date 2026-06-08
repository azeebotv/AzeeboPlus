# Diagnostics Tasks

## Summary
- **Total Errors:** 60+
- **Files Affected:** 26
- **Root Causes:** 5

---

## 1. Install Missing Dependencies

**Priority:** Critical  
**Services Affected:** `engagement-service`, `messaging-service`, `subscription-service`

### engagement-service
- [x] Run `npm install` to install:
  - `@nestjs/core`
  - `@nestjs/common`
  - `@nestjs/swagger`
  - `@nestjs/config`
  - `@nestjs/throttler`
  - `@nestjs/passport`
  - `@prisma/client`
  - `helmet`
  - `@azeebo/security`

### messaging-service
- [x] Run `npm install` to install:
  - `@nestjs/core`
  - `@nestjs/common`
  - `@nestjs/swagger`
  - `@nestjs/config`
  - `@nestjs/throttler`
  - `@nestjs/passport`
  - `@prisma/client`
  - `helmet`
  - `@azeebo/security`
  - `class-validator`

### subscription-service
- [x] Run `npm install` to install:
  - `@nestjs/core`
  - `@nestjs/common`
  - `@nestjs/swagger`
  - `@prisma/client`
  - `class-validator`

---

## 2. Fix Prisma Schema - Session Model

**Priority:** Critical  
**File:** `services/auth-service/src/modules/auth/device/device.service.ts`

Add missing fields to `Session` model in Prisma schema:
- [x] `deviceName` (String, optional)
- [x] `deviceType` (String, optional)
- [x] `os` (String, optional)
- [x] `browser` (String, optional)
- [x] `ipAddress` (String, optional)
- [x] `lastActiveAt` (DateTime)

Then regenerate Prisma client:
- [x] Run `prisma generate` in auth-service

---

## 3. Fix Prisma Schema - Messaging Models

**Priority:** Critical  
**File:** `services/messaging-service/src/modules/messaging/messaging.service.ts`

Add missing Prisma models:
- [x] `conversation` model
- [x] `message` model
- [x] `conversationParticipant` model

Then regenerate Prisma client:
- [x] Run `prisma generate` in messaging-service

---

## 4. Fix AuthContext - Missing Properties

**Priority:** High  
**Files:**
- `apps/web/src/app/profile/edit/page.tsx`
- `apps/mobile/app/(auth)/profile-setup.tsx`

Add to `AuthContextType`:
- [x] `refreshUser: () => Promise<void>` method

Add to `User` type:
- [x] `displayName: string` property

---

## 5. Fix Mobile API Exports

**Priority:** High  
**File:** `apps/mobile/src/api/index.ts`

Add missing exports:
- [x] `userApi` - exported from `user.ts`
- [x] `subscriptionApi` - exported from `subscription.ts`
- [x] `realityApi` - exported from `universe.ts`
- [x] `chatApi` - exported from `messaging.ts`

---

## 6. Fix Mobile Screen Imports

**Priority:** High  
**Files:** (15 files in `apps/mobile/app/`)

### Creator Screens
- [x] `app/(creator)/analytics.tsx` - Fix `../../../src/api` import path
- [x] `app/(creator)/drafts.tsx` - Fix `../../../src/api` import path
- [x] `app/(creator)/earnings.tsx` - Fix `../../../src/api` import path
- [x] `app/(creator)/monetization.tsx` - Fix `../../../src/api` import path
- [x] `app/(creator)/profile.tsx` - Fix `../../../src/api` import path

### Reality Screens
- [x] `app/(reality)/contestant.tsx` - Fix `../../../src/api` import path
- [x] `app/(reality)/episode.tsx` - Fix `../../../src/api` import path, remove unused `contentId`
- [x] `app/(reality)/episodes.tsx` - Fix `../../../src/api` import path
- [x] `app/(reality)/results.tsx` - Fix `../../../src/api` import path

### Other Screens
- [x] `app/(tabs)/profile/edit.tsx` - Fix `../../src/contexts/AuthContext` and `../../src/api` paths
- [x] `app/(tabs)/wallet/subscription-plans.tsx` - Add `subscriptionApi` export
- [x] `app/leaderboard.tsx` - Fix `../../src/api` import path
- [x] `app/messages.tsx` - Fix `../../src/api` import path, remove unused `router`
- [x] `app/predictions/[predictionId]/results.tsx` - Add `realityApi` export, remove unused `router`
- [x] `app/rankings.tsx` - Fix `../../src/api` import path
- [x] `app/recommendations.tsx` - Fix `../../src/api` import path, fix duplicate property on line 207
- [x] `app/reality/[showId]/live-chat.tsx` - Add `realityApi` and `chatApi` exports

---

## 7. Fix Wallet API

**Priority:** Medium  
**File:** `apps/mobile/app/transactions/[transactionId].tsx`

- [x] Change `getTransaction` to `getTransactions` (line 43) or add missing `getTransaction` method to wallet API

---

## 8. Fix Settings Devices Screen

**Priority:** Medium  
**File:** `apps/mobile/app/settings/devices.tsx`

- [x] Add `getDevices` method to auth API
- [x] Add `revokeDevice` method to auth API
- [x] Remove unused `router` import

---

## 9. Fix Device Controller Import

**Priority:** Medium  
**File:** `services/auth-service/src/modules/auth/device/device.controller.ts`

- [x] Fix import path for `device.service` (line 5)

---

## 10. Fix Messaging DTO

**Priority:** Medium  
**File:** `services/messaging-service/src/modules/messaging/dto/messaging.dto.ts`

- [x] Mark properties as optional or add definite assignment:
  - `participantIds` (line 18)
  - `content` (line 25)
  - `messageId` (line 37)

---

## 11. Fix Messaging Service Types

**Priority:** Medium  
**File:** `services/messaging-service/src/modules/messaging/messaging.service.ts`

- [x] Add explicit types for parameters:
  - `conv` (line 46)
  - `p` (line 54)
  - `msg` (line 94)
- [x] Remove unused `ForbiddenException` import (line 1)

---

## 12. Fix Subscription Service PrismaService

**Priority:** Medium  
**File:** `services/subscription-service/src/modules/database/prisma.service.ts`

- [x] Add `$connect` method
- [x] Add `$disconnect` method

---

## 13. Fix Design Tokens Import

**Priority:** Low  
**File:** `apps/mobile/src/components/PasswordInput.tsx`

- [x] Update `tsconfig.json` to include `packages/design-tokens/src` in paths, or fix import resolution

---

## Verification

After completing all tasks:
- [x] Run `npm install` in all service directories
- [x] Run `pnpm tsc --noEmit` to verify all TypeScript errors are resolved
- [x] Run lint check
