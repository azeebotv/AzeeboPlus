/**
 * @azeebo/react-data — shared React Native data layer.
 *
 * Consumed by apps/mobile and apps/tv. Platform-specific code
 * (notifications, biometrics, Apple/Google Pay, haptics, TV player)
 * stays in the respective app's src/ — only the platform-agnostic
 * data surface lives here.
 */

// ── API services (barrel: client + all domain services) ───────
export * from './api';

// ── Contexts ──────────────────────────────────────────────────
export * from './contexts/AuthContext';
export * from './contexts/FlagsContext';
export * from './contexts/WalletContext';

// ── Hooks ─────────────────────────────────────────────────────
export * from './hooks/useContentQuery';
export * from './hooks/useFeatureFlags';
export * from './hooks/useProfileQuery';
export * from './hooks/useSecureStorage';
export * from './hooks/useStorage';
export * from './hooks/useWalletQuery';

// ── Utils ─────────────────────────────────────────────────────
export * from './utils/logger';
export * from './utils/lowData';
export * from './utils/mediaCache';
export * from './utils/deepLinking';
export * from './utils/certificatePinning';
export * from './utils/format';
export * from './utils/playbackActivity';

// ── Config (shared price presets / wallet limits) ─────────────
export * from './config/prices';

// NOTE: i18n is intentionally NOT in the barrel — it initializes i18next as
// a side effect and should only load via explicit import:
//   import '@azeebo/react-data/i18n';   (in each app's _layout.tsx)
// NOTE: types/api is intentionally NOT re-exported here — several of its
// names (ApiResponse, LeaderboardEntry) collide with names the api services
// already re-export. Screens import it via the '@azeebo/react-data/types/api'
// subpath.
