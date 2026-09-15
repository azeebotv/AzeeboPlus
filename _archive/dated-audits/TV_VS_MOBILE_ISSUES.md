# TV vs Mobile — Deep Comparison Issue List

Comparison of `apps/tv` (16 files, read in full) against `apps/mobile` (~250 route files) and the
shared `packages/react-data` layer both consume. Both apps **typecheck and lint clean** — every
issue below is behavioral. All findings verified by reading both surfaces' code on branch
`lint/promotion-machinery-steady-state`.

Legend: **C** = Critical (broken/lost money), **H** = High (wrong behavior, silent failures), **M** = Medium (parity/UX gap), **L** = Low (polish/consistency).

> **FIX STATUS (all verified: typecheck + lint + tests on react-data, tv, mobile):**
> C1 ✅ C2 ✅ C3 ✅ C4 ✅ C5 ✅ H1 ✅ H2 ✅ H3 ✅ H4 ✅ H5 ✅ H6 ✅ H7 ✅ H8 ✅ H9 ✅ H10(surface) ✅ H11(TV part) ✅
> M1 ✅ M3 ✅ M4 ✅ M5 ✅ M6 ✅ M7 ✅ M8 ✅ M10 ✅ M11 ✅ M12 ✅ M13 ✅ M14 ✅ L1 ✅ L2 ✅ L3 ✅ L4 ✅ L5 ✅ L6 ✅ L7 ✅ L8 ✅ L10 ✅ L11 ✅ L12(scoped) ✅
> M2 ✅ (search screen + Recently Watched rail shipped) · M15 ✅ (TV 14 tests incl. a focus-tag bug they
> caught; mobile 75 contract tests now running + 6 new: money-limit evaluation and deep-link aliases)
> Remaining open (H10-secrets, L9) — both need EAS account access; see **Open items**.
>
> Second-pass details: H4 — AmountInput live min/max feedback + real API limits passed from add-funds;
> H9 — guest watch gate (Sign-in-required screen); M3 — TV provider chips; M6 — TV Settings language
> section; M12 — splash bar holds at 90% until auth resolves, route timer cancelled on auth change;
> M14 — i18n bundle hoisted into react-data; L1 — animated focus.scale (1.08/150ms) on cards+buttons;
> L5 — `tv_autoplay` flag gates autoplay; L8 — live-shows poll through shared client; L10 — refresh
> timeout; L11 — biometric isSubmitting + analytics.
>
> Third-pass details: C3 — `classifyPollFailure` in react-data encodes the RFC 8628 §3.5 contract
> (401/403 terminal, 410 expired, 5xx/network transient) + 8 tests; TV poll loop consumes it.
> H10 — TV app.json now carries the CERT_PIN_* surface (placeholders, real values via EAS secrets,
> documented in .env.example). M2 (subset) — TV home gained a real Recently Watched rail via
> `contentApi.getWatchHistory`. M4 — signed-url 403s surface as `errorKind: 'entitlement'` from both
> player hooks; mobile watch offers a "See Premium plans" CTA to /premium, TV explains the upgrade
> path (no purchase surface on TV). L3 — TV settings restructured so no hook can end up after an
> early return. L6 — `azeebo://wallet/fund` and `/wallet/add-funds` both resolve to mobile's
> add-funds screen (+5 deep-link tests). L12 — shared error catalog keys (errorNetwork,
> errorEntitlement, errorPaymentUnavailable, premium) added to all 6 languages and used by the
> new states.

---

## CRITICAL — broken user-facing functionality

### C1. Mobile Profile menu links route to screens that don't exist
`apps/mobile/app/(tabs)/profile/index.tsx` → `handleMenuPress` pushes:
- `/settings/privacy` — only `app/settings/devices.tsx` exists
- `/settings/parental` — does not exist
- `/settings/about` — does not exist

Expo Router throws "No route matched" at runtime. "Privacy & Security", "Parental Controls", and "About" menu items are dead buttons.

### C2. Mobile splash screen auto-redirects users to login even when signed in
`apps/mobile/app/index.tsx` — the progress-interval effect routes `isAuthenticated ? '/(tabs)' : '/(auth)/login'` after a fake progress animation, but it fires whenever `showContent` becomes true while `isLoading` is false. On the very first frame `isLoading` is still `true` from AuthProvider, but once the interval starts, a *slow* auth restore races the animation; and any time `isAuthenticated` is momentarily false during token refresh the user is dumped at login. Worse: "Get Started" / "Sign In" buttons call `router.replace('/(auth)/login')` unconditionally, so a signed-in user tapping them loses their session context (no auto-forward to home like the effect does). TV does this correctly via `useFocusEffect` + `isAuthenticated` check.

### C3. TV sign-in status handling: token-only 401 during poll kills the flow without surfacing why
`apps/tv/app/signin.tsx` polls `deviceAuthApi.poll(deviceCode)`; the shared `apiClient` (packages/react-data/src/api/client.ts) will attempt a token refresh on 401 and, on refresh failure, invoke `onRefreshFailureCallback` → `logout()` → wipes storage. If the TV is *already signed in* and starts a device-link (settings → sign out path), this is fine — but if a signed-in TV ever hits 401 mid-poll the screen shows generic "Lost connection" instead of the real auth state, and the in-flight link is abandoned silently (no `deny`/cleanup call to the server).

### C4. Mobile "Continue Watching" rail is hard-coded to fake 50% progress
`apps/mobile/src/components/homepage/AuthenticatedHomepage.tsx`:
```ts
const [continueWatching] = useState<ContentItem[]>([]);   // never populated
...
progressMap={Object.fromEntries(continueWatching.map((c) => [c.id, 0.5]))}
```
The section renders an empty rail gated behind `mobile_new_home`, and if items were ever added the progress would be a fabricated 0.5. The real per-item `watchProgress` map (used by Recently Watched) is ignored here. TV home doesn't have this section at all — parity gap both ways: TV shows no Continue Watching despite the mobile design intent that watch history feeds it on every surface (per `useTVVideoPlayer` docstring).

### C5. Mobile watch screen hard-fails on missing duration (divide-by-zero regression risk) + fake fallback
`apps/mobile/app/watch/[contentId].tsx`: `const displayDuration = duration || content.duration || 3600;` — when neither the player nor the metadata has a duration, the seek bar silently maps the whole timeline onto a fake 1-hour video. TV version (`apps/tv/app/watch/[contentId].tsx`) correctly uses `duration || content?.duration || 0` and clamps. Mobile's fake 3600 makes any seek land at the wrong position and the progress bar jumps.

---

## HIGH — wrong behavior, silent data loss, security

### H1. i18n is never initialized at app startup on either app (translations silently fall back to raw keys)
- `apps/mobile`: `src/i18n.ts` exists with 6 languages, but **no root file imports it**. `_layout.tsx` doesn't, `app/index.tsx` doesn't, no `babel` plugin does. Only `(tabs)/settings.tsx` and `src/components/ui/LanguageSwitcher.tsx` import from it for `changeLanguage` — importing that module does run its side-effect `i18n.init(...)`, but **only after the user opens Settings or LanguageSwitcher is first rendered**. Until then, every `t('home.recentlyWatched')` etc. in AuthenticatedHomepage/GuestHomepage/HeroCarousel/ContentRow/ContentCard returns the raw key (react-i18next `getI18n()` returns undefined instance → fallback `t` returns the key itself).
- `apps/tv`: identical problem — `src/i18n.ts` never imported by `app/_layout.tsx` or `app/index.tsx`. TV home renders literal "home.trending", "home.newReleases", "home.welcomeBack", "content.watch" strings.
- Confirmed by reading react-i18next 15.x `useTranslation.js`: with no instance it warns once and returns identity `t`.
- Additionally TV's `react-i18next` resolves **only via `shamefully-hoist=true`** (it is not a declared dependency of `@azeebo/tv`; verified `apps/tv/node_modules` lacks it). Mobile at least declares it. Any hoisting change breaks the TV build at runtime, not compile time.

### H2. Mobile add-funds: verify runs before the user returns from checkout — result is almost always wrong
`apps/mobile/app/(tabs)/wallet/add-funds.tsx` → `handleAddFunds` opens the provider URL via `Linking.openURL(authorizationUrl)` then **immediately** runs `verifyPaymentWithRetry(reference)` (5 attempts × 2s = ~10s total) and then `router.back()` — all while the user is still in the Paystack/Flutterwave webview. The user hasn't paid yet, so verify reports "Payment Pending", and the screen pops the stack behind their back. TV's `wallet/fund.tsx` does this correctly (poll every 3s for 5 minutes until terminal state, then show success). Mobile should verify on `AppState === 'active'` or on return-from-background like TV's flow, and must not `router.back()` before verification completes.

### H3. Mobile add-funds silently treats provider-list success-with-empty-list as OK
`fetchProviders` in add-funds only sets error state on **thrown** exceptions. If `paymentApi.getProviders()` returns `{ success: true, data: [] }` (server outage fallback), the UI falls back to the hard-coded `PAYMENT_METHOD_META` list (paystack/bank/ussd/mobile) and lets the user select methods the backend can't honor; `fundWallet` then fails with an opaque error. TV's `fund.tsx` handles this correctly: empty providers → explicit "No payment providers are available right now."

### H4. Both apps accept any amount the API allows; mobile lacks max-length/clamp on AmountInput
`apps/mobile/src/components/AmountInput.tsx` (used by add-funds) does not clamp to `walletLimits.maximumDeposit` on input — validation only runs in `validateForm()` on submit, so the user can paste `999999999` and get a friendly error *after* pressing Pay. TV restricts to preset chips (safer), but has no custom-amount path at all — the mirror-image limitation (M-level, listed below for TV).

### H5. Wallet balance shown in header uses stale context, not the query cache
`apps/mobile/app/(tabs)/_layout.tsx` `HeaderUtilities` reads `useWallet().wallet` (context, fetched once at login) while TV's `fund.tsx` and the rest of mobile use `useWalletQuery`. After funding on mobile the header badge does not update until app restart (TV refreshes via `getWallet()` after verify — mobile add-funds never calls `getWallet()` after success).

### H6. Session timeout (30-min inactivity logout) fires for TV viewers mid-playback
`packages/react-data/src/contexts/AuthContext.tsx` sets a 30-min `setTimeout(logout)` and only resets it on `AppState` foreground/background transitions. On TV, playback is not an AppState change — a user watching a 45-min episode in one sitting gets logged out at 30 minutes, landing them back on the device-link screen mid-episode. Mobile mostly avoids it because touches/navigation happen more often... but actually nothing resets the timer on navigation on either app (only on `user` change and AppState). The effect deps `[user, resetSessionTimer, clearSessionTimer]` mean the timer is only armed once per sign-in. Any interaction after 30 minutes silently logs out both platforms; on TV it is near-guaranteed during long videos.

### H7. TV `useTVVideoPlayer` progress save: 10s interval writes fire even when position hasn't advanced (paused-then-resumed edge)
`apps/tv/src/hooks/useTVVideoPlayer.ts` — the interval effect calls `onProgressUpdate(player.currentTime)` every 10s while `isPlaying`, plus flushes on pause. It does not dedupe (mobile's hook has `lastSavedPositionRef` dedup). Every seek also fires `onProgressUpdate`. Combined with `contentApi.addToWatchHistory` POSTing on each, a 30-min TV session produces ~180 identical-position POSTs after transient pauses. Mobile's hook correctly dedupes via `lastSavedPositionRef`.

### H8. TV watch screen: `useEffect` auto-hide timer depends on `currentTime`, causing controls to flicker
`apps/tv/app/watch/[contentId].tsx`:
```ts
useEffect(() => { if (!isPlaying || !showControls) return;
  const timer = setTimeout(() => setShowControls(false), 4000);
  return () => clearTimeout(timer);
}, [isPlaying, showControls, currentTime]);
```
`currentTime` changes every second (`timeUpdateEventInterval = 1`), so the 4s timer is torn down and recreated every second — the overlay will effectively hide 4s after the *last* tick, i.e. hide while the user is mid-lookup, then a stray key re-shows it. The intent (hide 4s after last user interaction) requires a user-interaction timestamp dependency, not the clock.

### H9. Mobile `GuestHomepage` CTA routes and `HeroCarousel` — guests get content that requires auth without any guard feedback
Guest homepage loads `getFeaturedContent`/`getTrendingContent` and renders ContentRows; pressing any card routes to `/watch/[id]`. The watch screen has no auth gate, then fails at `getSignedUrl` (401 → refresh → logout via client's `onRefreshFailureCallback`). The user sees "Failed to load video" and, worse, the failed refresh **logs out their session if they had one**. TV handles this correctly by redirecting unauthenticated users to `/signin` via `useFocusEffect` on home.

### H10. Certificate pinning: both apps share `initializeCertificatePinning()` but TV app.json carries no pin config surface
`apps/tv/app.json` `extra` has no `CERT_PIN_*` fields (mobile has them via EAS secrets). TV gets the same "unenforced" warn-only behavior, but there's no CI knob to ever turn it on — a release-config divergence that will silently ship TV with pinning permanently off.

### H11. Mobile watch progress flush drops the final position on navigate-away-while-playing (partially fixed, still broken on Android back-gesture)
`apps/mobile/src/hooks/useVideoPlayer.ts` flushes on pause/unmount, but the unmount flush runs `player.pause()` then `flushProgress()` — with the shared player singleton, navigating to the mini-player path (`notifyScreenBlur` → `miniVisible`) intentionally pauses+flushes, yet `useEffect` cleanup on unmount of the *screen* (not the provider) also fires. On Android 13+ predictive back, the unmount cleanup can race the provider's blur handler, double-flushing or dropping the final position. TV has a single, simpler owner (no PiP) so no race — but TV also never flushes on unmount at all (only on pause/interval), so backing out of the TV player mid-playback loses up to 10s of progress.

---

## MEDIUM — parity and UX gaps

### M1. TV home shows NO thumbnails for any rail item
`FocusableRow` renders `rowCardImageFallback` (a text placeholder) — the `item.thumbnail`/`mediaAsset.thumbnailUrl` value captured by `toRailItems` is never used. Mobile's `ContentCard` renders real `<Image>` posters. TV_SETUP.md acknowledges this ("Images: swap placeholder title-cards"), but it ships today as the default experience.

### M2. TV has no search, no Continue Watching, no universe/category browsing
Mobile has 17+ verticals (movies, sports, comedy, music, lifestyle, creators, live, watch-party, games, predictions...). TV home = hero + 2 rails (trending/new releases). The device-link sign-in exists precisely for the lean-back experience, but there's nothing to lean back *to* beyond two rails. No rail for Recently Watched despite the shared `contentApi.getWatchHistory` being one import away.

### M3. TV wallet funding: provider choice is first-available only
`apps/tv/app/wallet/fund.tsx`: `const provider = providers[0];` — if Paystack is down but Flutterwave is healthy, TV users cannot pay. Mobile offers the full provider picker. At minimum TV should surface which provider is being used *before* Continue (it does in the fine print) and support selecting among available ones.

### M4. Mobile paywall/premium gating missing on watch screen
`apps/mobile/app/watch/[contentId].tsx` renders `content.isPremium` as a badge only (`💎 Premium`). Nothing checks entitlement/subscription before `getSignedUrl` — the API presumably enforces it, so premium users see a broken player error instead of an upgrade prompt. TV doesn't even show the premium badge.

### M5. TV sign-in hard-codes the activation URL
`const ACTIVATION_URL = 'https://azeebo.tv/link'` in `apps/tv/app/signin.tsx` — not derived from env/config (`EXPO_PUBLIC_*`). If the link page moves to a different domain per environment (staging), staging TVs instruct users to visit prod. Mobile has no equivalent screen.

### M6. Language selection exists on mobile but not TV (and mobile's is unreachable from profile)
- Mobile: `(tabs)/settings.tsx` has the full language switcher with 6 languages.
- TV: `settings.tsx` has only account info + sign out. i18n resources for `ha/yo/ig` ship in the TV bundle unused.
- Neither profile screen links to mobile Settings from Profile's menu (MENU_ITEMS has no "Settings" entry — Settings is a separate tab, but Profile's "Preferences" toggles (push/email) are local-only switches that don't persist anything).

### M7. Mobile Profile "Push/Email Notifications" switches are decorative
`(tabs)/profile/index.tsx` keeps `pushEnabled`/`emailEnabled` in local state — flipping them does nothing (no API call, no persistence). The real notification-preferences API + query exists in `(tabs)/settings.tsx`. TV has neither.

### M8. Analytics: neither app instruments the flows that matter
`apps/mobile/src/utils/analytics.ts` exists and `@azeebo/analytics-sdk` is a dependency of both apps, but zero `trackEvent` calls exist in homepage components, watch screens, sign-in, or wallet flows on either platform (searched). The AGENTS.md workflow (`/add-analytics`) is not applied here.

### M9. Error states lack retry on TV
`apps/tv/src/components/StateContainers.tsx` `ErrorState` renders text only — no `onRetry` prop, and `watch/[contentId].tsx`/`index.tsx` pass none. Mobile's `ErrorState` accepts `onRetry` and watch uses it. On TV a transient network failure strands the viewer on a dead screen; remote Back is the only exit.

### M10. Mobile watch screen comments/like/share/save buttons are dead
All four `actionButton`s in `watch/[contentId].tsx` have no `onPress`. "Subscribe" and "View Profile" also do nothing. TV doesn't have these affordances (fine for 10-foot), but mobile shipping visible-but-dead controls is a trust/quality issue.

### M11. TV `FocusableRow` rails wrap instead of scroll
`rowList` uses `flexWrap: 'wrap'` with fixed 320px cards — a 12-item rail wraps to 2 rows and D-pad focus must travel through *every* card to reach row 2, then visually "down" is ambiguous with nextFocusLeft/Right chains (which only handle horizontal). A 10-foot rail should horizontally scroll with padding-based peek, as mobile's `ContentRow` (horizontal ScrollView) does.

### M12. Mobile splash "fake progress" bar is meaningless
`app/index.tsx` animates 0→100 over ~1.5s unrelated to real loading, then routes. It also renders "Get Started"/"Sign In"/"Sign Up" *above the fold* for authenticated users who are about to be auto-routed — a flash of wrong CTA. TV skips all of this (direct to content, sign-in redirect handled by focus effect).

### M13. Theme drift: mobile watch screen uses raw hex instead of tokens
`apps/mobile/app/watch/[contentId].tsx` styles hard-code `#E8420A`, `#1a1a1a`, `rgba(139, 92, 246, 0.8)` (a *purple* play button — off-brand), `#fff`, `#000` etc. TV consistently uses `colors.*` tokens everywhere. The purple play button (rgba(139,92,246)) is the brand violation: brand primary is `#E8420A`.

### M14. Duplicate i18n bundles will drift
`apps/tv/src/i18n.ts` and `apps/mobile/src/i18n.ts` are near-identical 6-language resource files (~520 lines each, copy-pasted). The shared `@azeebo/react-data` package was created precisely to prevent this ("so the two surfaces cannot drift" per TV_SETUP.md), yet the largest shared asset lives as two forks. Any new string must be added twice; they already differ in nothing today but will diverge.

### M15. TV `package.json` test script is `jest --passWithNoTests` — there are no tests on TV
Mobile has unit tests (`jest.config.js`), contract tests (`e2e/jest.contract.config.js`) and Detox e2e. TV has zero tests and no lint of `app/` beyond `eslint src app` (which passes vacuously since there are no rules catching the issues above).

---

## LOW — polish / consistency

### L1. TV `Focusable.tsx` claims scale focus treatment but never applies it
`theme.ts` exports `focus.scale = 1.08` and `transitionMs = 150`; `FocusableCard`/`FocusableButton` apply only border+opacity. The documented "focused item scales up" doesn't happen. Either wire `transform: [{ scale }]` (no reanimated on TV, so use LayoutAnimation or drop the claim) or remove the token.

### L2. `rowTagCounter` module-level mutation in `FocusableRow`
`let rowTagCounter = 1000; const rowTagBase = ++rowTagCounter;` inside the component body — increments on every render, so focus tags churn across renders and `nextFocus*` values are unstable identities. Works today because RN compares tags numerically at the native layer per commit, but it's fragile and makes debugging focus graphs noisy. Compute in `useMemo` on `items.length`.

### L3. TV settings screen `if (!user) return ...` before hooks
`apps/tv/app/settings.tsx` documents that it splits into outer/inner components to "obey the rules of hooks," but the outer component still calls `useRouter` + `useAuth` then conditionally returns — that part is fine (both hooks ran), however the pattern is one refactor away from violation. Mobile profile handles the same case inside one component.

### L4. `formatTime` duplicated 3× (mobile hook, TV hook, mobile ContentCard duration badge)
Identical logic; belongs in `@azeebo/react-data` utils next to `logger`.

### L5. TV watch screen plays immediately on entering (autoPlay: true) while mobile defaults to tap-to-play (flag `mobile_autoplay`)
Deliberate per comments, but note the asymmetry is unflagged on TV — ops cannot turn TV autoplay off without a release. Consider gating on `tv_autoplay` flag for symmetry.

### L6. Mobile `(tabs)/payment.tsx` referenced by header wallet badge route mismatch
Header wallet button routes to `/(tabs)/wallet` while `fund` flow routes use `/wallet/fund` (TV) vs `/(tabs)/wallet/add-funds` (mobile) — naming is inconsistent across surfaces, complicating deep links (`azeebo://` handler in `packages/react-data/src/utils/deepLinking.ts` must special-case each).

### L7. `walletLimits` shipped as constants in *both* apps' `src/config/prices.ts` (identical forks)
Same file duplicated verbatim in both apps (including the `createLogger('Pricing')` and async API functions that TV never calls). TV only uses `addFundsPresetAmounts` and `walletLimits` from it. Should live in `@azeebo/react-data` once.

### L8. Mobile `HeaderUtilities` polls live-shows with raw `fetch` instead of the shared client
`apps/mobile/app/(tabs)/_layout.tsx` builds `${apiClient.getBaseURL()}/api/v1/reality/shows/live` — bypasses pinning wrapper, timeout, RFC7807 error normalization, and auth header. TV would need this endpoint too for a LIVE badge; route through `apiClient` if added.

### L9. TV `app.json` reuses the mobile EAS projectId
`3627eb83-fb81-4f76-bae5-668a14102705` appears in both `apps/tv/app.json` and `apps/mobile/app.json`. EAS project IDs are per-project; sharing means EAS builds/updates for TV land in the mobile project's channel namespace. OTA updates (`expo-updates`) are mobile-only today so impact is limited to EAS metadata confusion — but it will bite when TV adds updates.

### L10. `packages/react-data/src/api/client.ts` 30s timeout applies to device-auth poll
TV's sign-in poll runs every `intervalSec` (default 5s) via the same client with a 30s AbortController timeout — fine — but `attemptTokenRefresh` has no timeout/abort of its own and can hang the poll loop's error path.

### L11. Mobile `login.tsx` shows the full glass card without a logo on success-path biometric devices
Minor: after `handleBiometricLogin` succeeds, `router.replace('/(tabs)/home')` runs but `setIsSubmitting` isn't reset (it's never set for biometric). Harmless but inconsistent with the password path.

### L12. Both apps' error messages mix tone/branding
"Something went wrong", "Playback error occurred", "Could not reach the sign-in service..." — no shared error-message catalog; i18n has `common.error` but nothing uses it. Errors are user-facing English-only even though 6 languages ship.

---

## Cross-cutting architectural observations

1. **The shared layer works** — auth, flags, wallet contexts, API client, device-auth, storage hooks are genuinely shared and correct. The drift is in *app-level* forks: i18n, prices config, and now behavior (see H1, M14, L7).
2. **TV is a thin, polished client with 20% of the features.** Sign-in (device-link), home, watch, wallet-fund are production quality; everything else is absent. The biggest product gaps are search (M2), Continue Watching (C4/M2), and thumbnails (M1).
3. **Mobile is feature-rich but uneven.** The newest surfaces (homepage, player hooks, settings) show strong patterns; older screens (profile, watch info pane) hard-code colors, dead buttons, and broken routes (C1, M10, M13).
4. **No surface validates entitlements client-side.** Whether TV or mobile, premium gating is delegated to the signed-URL endpoint; UX for the "not entitled" case is a raw error on both (M4).
5. **Testing asymmetry is severe**: mobile has 3 test layers, TV has zero (M15) — and the shared package's tests (`packages/react-data/src/**/__tests__`) don't cover device-auth poll or client refresh behavior that TV depends on most.

---

## Suggested fix order (by risk × reach)

| # | Item | Status |
|---|------|--------|
| 1 | H1 — init i18n at startup both apps + declare react-i18next in TV deps | ✅ FIXED |
| 2 | C1 — retarget the 3 missing mobile profile routes | ✅ FIXED |
| 3 | H2/H3 — port TV's poll-until-settle flow to mobile add-funds (+H5 wallet refresh) | ✅ FIXED |
| 4 | H6 — session-timer playback exemption (setPlaybackActive registry, shared) | ✅ FIXED |
| 5 | C5/H8 — duration fallback + TV controls timer dep | ✅ FIXED |
| 6 | M1 — render thumbnails in TV rails (+C4 fake rail removed) | ✅ FIXED |
| 7 | M5/M9 — env-derived activation URL + retry on TV error states | ✅ FIXED |
| 8 | M13 — token sweep incl. purple play button | ✅ FIXED |
| 9 | M14/L7/L4 — hoist prices + formatTime into `@azeebo/react-data` (shims keep imports) | ✅ FIXED |
| 10 | M8 — analytics on auth + payment seams both apps | ✅ FIXED |
| 11 | H7 + H11(TV) — progress dedupe + unmount/playToEnd flush | ✅ FIXED |
| 12 | C2 — splash routing race + auth-aware CTAs | ✅ FIXED |
| 13 | M11/L2 — TV rails horizontal scroll + stable focus tags | ✅ FIXED |
| 14 | M10/M7 — watch Share/Save wired, Like/Comment honest, profile switches persist | ✅ FIXED |
| 15 | M15 — TV jest + first tests; shared formatTime + playback registry tests (108/108) | ✅ FIXED |
| 16 | M14 (proper) — i18n bundle hoisted into react-data, app files become re-export shims | ✅ FIXED |
| 17 | H9 — mobile watch sign-in gate for unauthenticated users | ✅ FIXED |
| 18 | M3 — TV provider picker (D-pad focusable chips) | ✅ FIXED |
| 19 | M6 — TV Settings language section | ✅ FIXED |
| 20 | L5 — TV autoplay gated on `tv_autoplay` flag | ✅ FIXED |
| 21 | L8 — live-shows poll through shared apiClient | ✅ FIXED |
| 22 | L10 — timeout on attemptTokenRefresh | ✅ FIXED |
| 23 | L11 — biometric login isSubmitting + analytics | ✅ FIXED |
| 24 | L1 — animated focus scale applied on TV focusable cards/buttons | ✅ FIXED |
| 25 | H4 — AmountInput live min/max validation + real API limits from add-funds | ✅ FIXED |
| 26 | M12 — splash bar gated on real auth resolution; route timer cancellable | ✅ FIXED |
| 27 | C3 — device-link poll error contract (classifyPollFailure) + tests | ✅ FIXED |
| 28 | H10 (surface) — TV app.json CERT_PIN_* config + EAS secret docs | ✅ FIXED |
| 29 | M2 (subset) — TV Recently Watched rail from real watch history | ✅ FIXED |
| 30 | M4 — entitlement 403 → Premium upgrade CTA (mobile) / explanation (TV) | ✅ FIXED |
| 31 | L3 — TV settings hooks-pattern hardening | ✅ FIXED |
| 32 | L6 — wallet fund deep-link route aliases (+5 tests) | ✅ FIXED |
| 33 | L12 (scoped) — 6-language error catalog keys wired into new states | ✅ FIXED |
| 34 | M2 — TV search screen (debounced on-screen input, focusable results, i18n in 6 languages) + home Search entry | ✅ FIXED |
| 35 | M15 — TV analytics + focus-tag tests (14 total); tests caught a real focus-tag collision bug, fixed in source | ✅ FIXED |
| 36 | M15 — mobile test coverage: shared `evaluateAmountLimits` (+6 tests, wired into AmountInput) and deep-link alias contract tests (+3, runnable via the e2e config) | ✅ FIXED |

---

## Open items (not fixed in this pass)

- **H10 (secrets)** — TV's pin *surface* is in place; the actual `eas secret:create` provisioning
  for `CERT_PIN_*` must be done by someone with EAS account access (commands documented in
  `apps/tv/.env.example`).
- **L9** — TV app.json reuses the mobile EAS projectId: needs an EAS project decision/creation by
  someone with account access; changing the id affects existing EAS metadata.

**Server-side counterparts to client fixes in this pass:** keep the device-link poll endpoint on
401 for invalid/consumed codes and use 5xx for outages (C3 contract in
`packages/react-data/src/api/device-auth.ts`); return 403 (not 200-with-empty-list) from the
signed-url endpoint only for entitlement denials so `errorKind: 'entitlement'` stays accurate (M4).
