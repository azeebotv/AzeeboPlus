# Refactor Plan

## 1. Security Cleanup
- Remove hard‑coded credentials from `.env` and services.
- Replace `JWT_SECRET || '...'` fallbacks with `ConfigService.getOrThrow`.
- Replace CORS wildcard with comma‑separated env list.
- Ensure `.env` is listed in `.gitignore`.

## 2. Mock Data Replacement
- Web components (`reality`, `vertical`, `lifestyle`, `comedy`, `sports`, `games`, `rewards`, `notifications`, `search`, `support`, `creators/dashboard`) replace hard‑coded lists with real API calls.
- Mobile components (`watch/reality-show.tsx`, `prediction.tsx`, `vote.tsx`, `episodes.tsx`, `create.tsx`, `support.tsx`, `creators/signup.tsx`, `profile.tsx`, etc.) replace local data with API calls.

## 3. Missing Screens Implementation
- Create `apps/mobile/app/(auth)/role-selection.tsx` and `apps/web/src/app/auth/role-selection/page.tsx`.
- Create creator‑dashboard sub‑routes: `overview`, `content`, `analytics`, `earnings`, `settings` under `apps/web/src/app/creators/dashboard`.

## 4. Error Handling Enhancement
- Add loading, error, and empty states to all pages.
- Add retry buttons where applicable.
- Centralize logger usage.

## 5. Tests & Lint
- Update unit tests to use mocks/fixtures.
- Run `pnpm run test` and `pnpm run lint`.

# Execution Order
1. Security Cleanup
2. Mock Data Replacement
3. Missing Screens
4. Error Handling
5. Tests & Lint
