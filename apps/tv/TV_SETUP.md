# Azeebo+ TV

Android TV / Fire TV / tvOS app for Azeebo+, sharing the data layer with the
mobile app (`apps/mobile`).

## Architecture

```
apps/tv/
├── app/                      # expo-router screens
│   ├── _layout.tsx           # Providers: Auth, Flags, Wallet (shared contexts)
│   ├── index.tsx             # Home: hero spotlight + focusable rails
│   └── watch/[contentId].tsx # Fullscreen player w/ D-pad transport controls
├── src/
│   ├── hooks/useTVVideoPlayer.ts # TV player: D-pad transport + seek mapping
│   ├── components/           # TV-native: Focusable primitives, states
│   ├── theme.ts              # 10-foot UI scale, re-exports brand palette
│   ├── config/               # TV pricing config
│   ├── i18n.ts               # Translations
│   └── types/modules.d.ts    # Ambient module declarations
└── app.json                  # leanback + banner + landscape + azeebo-tv scheme

The shared data layer (api services, auth/flags/wallet contexts, query +
storage hooks, utils, api wire types) lives in `@azeebo/react-data`
(packages/react-data) and is imported by both this app and apps/mobile.
### Sharing strategy

The shared data layer is the workspace package **`@azeebo/react-data`**
(`packages/react-data`, source-first like `@azeebo/ui`): api services,
`types/api.ts`, the Auth/Flags/Wallet contexts, the storage + query hooks,
and the platform-agnostic utils. Both apps import it via tsconfig path
mappings (`@azeebo/react-data`, `@azeebo/react-data/*`), so there is a single
source of truth and the two surfaces cannot drift.

Platform-specific code stays in each app's `src/`: notifications,
biometrics, Apple/Google Pay and haptics on mobile; the D-pad player and
Focusable primitives on TV.

## TV platform configuration

### Android TV (leanback)

`app.json` sets:

```json
"androidTv": {
  "banner": "./assets/tv-banner.png",
  "leanback": true
}
```

After `npx expo prebuild -p android`, the generated `AndroidManifest.xml` will
contain:

- `<category android:name="android.intent.category.LEANBACK_LAUNCHER" />` —
  makes the app appear on the Android TV home screen / launcher
- `<android:banner>` — the 320×180 banner shown on the TV launcher
- `android:leanback` — marks TV support in Play Store listings

Verify after prebuild that the manifest contains the leanback category; if
Expo's config plugin doesn't emit it for your SDK version, add it via a config
plugin or `android/app/src/main/AndroidManifest.xml` (intents section).

### tvOS

`app.json` includes tvOS-ready iOS settings (`UIRequiresFullScreen` — required
by Apple for TV apps). A full tvOS target requires:

```bash
npx expo prebuild -p ios
# open ios/*.xcworkspace in Xcode
# File → New → Target → Apple TV App (or add tvOS destination support)
```

Apple requires a dedicated tvOS target; the same JS bundle runs on both iOS
and tvOS targets.

## Running

```bash
# Install deps from repo root (workspace-aware)
pnpm install

# Start dev server
cd apps/tv && pnpm start

# Android TV: use an Android TV emulator (AVD with "Android TV" system image)
# or sideload to a Fire TV / Android TV device via adb
pnpm android

# tvOS: Apple TV simulator via Xcode
pnpm ios
```

## Remote-control reference (watch screen)

| Key | Action |
|---|---|
| Select / Enter (center D-pad) | Play / Pause |
| Left / Right (D-pad) | Seek ∓10s |
| Media Fast-Forward / Rewind | Seek ±10s |
| Back | Exit player |

## TV-specific deviations from mobile

| Mobile | TV | Why |
|---|---|---|
| Bottom tab bar | Hero + horizontal rails | 10-foot UI convention |
| Touch gestures | D-pad focus (`Focusable*` primitives) | Remotes have no touch |
| Push notifications (`expo-notifications`) | Removed | TV platforms don't support Expo push |
| Biometric unlock (`expo-local-authentication`) | Removed | No Face ID / fingerprint hardware on TV |
| Apple/Google Pay, Paystack redirect | Not ported yet | Needs QR-to-phone handoff (see roadmap) |
| Portrait lock | Landscape | TVs are 16:9 |
| `react-native-reanimated` / `gesture-handler` | Not installed | Touch-only; focus scale uses plain styles |

## Roadmap to production

1. **Auth on TV**: email/password works today; add device-link sign-in
   (`app.azeeboplus.com/link` + code) — typing an email on a D-pad is hostile UX.
2. **TV commerce**: QR-code-to-phone handoff for Paystack/Flutterwave
   checkout (render `authorizationUrl` as a QR on screen).
3. **Leanback banner asset**: replace the placeholder `assets/tv-banner.png`
   with real 320×180 xhdpi brand art.
4. **Workspace package extraction** for the shared data layer (see above).
5. **Images**: swap placeholder title-cards in `FocusableRow` for
   `expo-image` with poster URLs and caching (expo-image is already a dep).
6. **Deep links**: handle `azeebo-tv://watch/[id]` (scheme registered in
   app.json) for cross-surface handoff — "continue on TV".
7. **Play Store / tvOS App Store TV listings**: screenshots, descriptions,
   and the Play "Designed for Android TV" review track.
