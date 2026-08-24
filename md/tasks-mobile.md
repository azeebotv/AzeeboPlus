# Tasks — Mobile App (React Native)

> Derived from AZP-TAA-001 R2.0 §6, ADR-001, Appendix A
> Apps: `apps/mobile`

---

## 1. React Native Architecture (ADR-001, TAA §6)

| Task | Reference | Status |
|------|-----------|--------|
| React Native New Architecture enabled (Fabric + TurboModules) | ADR-001 | ✅ Implemented |
| Supported stable release pinned per release train | TAA §6 | ✅ Implemented |
| Android-first optimisation | TAA §6 | ✅ Implemented |
| iOS-compatible codebase (same architecture, not divergent) | TAA §6 | ✅ Implemented |
| Hermes JS engine enabled | Best practice | ✅ Implemented |
| Flipper/debugging tools configured | Best practice | ✅ Implemented |

---

## 2. App Structure & Navigation

| Task | Reference | Status |
|------|-----------|--------|
| Tab-based navigation (home, explore, library, profile) | — | ✅ Implemented |
| Deep-link handling for content sharing | AZP-VERT-005 | ✅ Implemented |
| Auth flow (login, signup, forgot password, OTP) | AZP-AUTH-001–005 | Partial |
| Onboarding flow | — | Partial |
| Error/forbidden/offline/maintenance screens | — | ✅ Implemented |
| Settings and preferences screens | — | Partial |

---

## 3. Security (OWASP MASVS, TAA §6)

### 3.1 Secure Storage

| Task | Reference | Status |
|------|-----------|--------|
| Access tokens in Keychain/Keystore via expo-secure-store | TAA §6 | ✅ Implemented |
| Refresh tokens in Keychain/Keystore | TAA §6 | ✅ Implemented |
| User profile data in AsyncStorage (2KB limit noted) | TAA §6 | ✅ Documented |
| No sensitive data in AsyncStorage | TAA §6 | ✅ Verified |
| No plaintext credentials anywhere | TA-LAW-06 | ✅ Verified |

### 3.2 Network Security

| Task | Reference | Status |
|------|-----------|--------|
| TLS for all API communication | TAA §52 | ✅ Enforced |
| Certificate pinning consideration | OWASP MASVS | ✅ Implemented |
| Network security configuration (Android) | OWASP MASVS | ✅ Implemented |
| App Transport Security (iOS) | OWASP MASVS | ✅ Implemented |

### 3.3 Binary Security

| Task | Reference | Status |
|------|-----------|--------|
| No API keys or admin credentials in binary | TA-LAW-06 | ✅ Verified |
| Release signing (Android APK/AAB, iOS IPA) | TAA §53 | ✅ Documented |
| ProGuard/R8 obfuscation (Android) | Best practice | ✅ Documented |
| Jailbreak/root detection consideration | OWASP MASVS | ✅ Implemented |
| Tamper detection/resilience | TAA §53 | ✅ Implemented |

### 3.4 Session Management

| Task | Reference | Status |
|------|-----------|--------|
| Short-lived access tokens | TAA §49 | ✅ Backend enforced |
| Token refresh mechanism | TAA §49 | Partial |
| Session invalidation on logout | TAA §49 | Partial |
| Multi-device session awareness | TAA §49 | Partial |
| Forced upgrade flow for security-critical old clients | TAA §89 | ✅ Implemented |

---

## 4. Media Playback

| Task | Reference | Status |
|------|-----------|--------|
| Native-capable player integration | TAA §6 | Partial |
| Adaptive bitrate streaming (HLS) | TAA §23 | Partial |
| Data Saver mode (low-bandwidth rendition) | AZP-MEDIA-003 | Partial |
| Resume/continue watching | AZP-MEDIA-002 | Partial |
| Playback telemetry (rendition, startup, buffering, completion) | AZP-MEDIA-005 | Partial |
| Graceful degradation on network issues | AZP-MEDIA-006 | Partial |
| Vertical 9:16 native playback | AZP-VERT-001 | Partial |
| Sequential vertical continuation | AZP-VERT-002 | Partial |
| Progress persistence across sessions | AZP-VERT-003 | Partial |
| Captions/subtitles display | AZP-VERT-004 | Partial |
| Picture-in-picture support | Nice-to-have | ✅ Implemented |

---

## 5. Content Discovery & Storyworld

| Task | Reference | Status |
|------|-----------|--------|
| Home feed with configurable modules | AZP-HOME-001 | Partial |
| Continue watching feed | AZP-HOME-002 | Partial |
| Explore categories with universe flags | AZP-EXP-001/002 | Partial |
| Search with availability-aware results | AZP-SEARCH-001/003 | Partial |
| Title detail pages per universe | AZP-MS-001 | Partial |
| Storyworld hub | AZP-STORY-001 | Partial |
| Character pages | AZP-STORY-002 | Partial |
| Relationship view | AZP-STORY-003 | Partial |
| Timeline view | AZP-STORY-004 | Partial |
| "What You Know" knowledge-safe view | AZP-STORY-005 | ✅ Implemented |
| Progressive unlock UI | AZP-STORY-006 | ✅ Implemented |
| Locked deep-link handling | AZP-STORY-007 | ✅ Implemented |

---

## 6. Commerce & Rewards

| Task | Reference | Status |
|------|-----------|--------|
| Subscription plans display | — | Partial |
| Payment flow (in-app purchase / web checkout) | AZP-COM-001 | Partial |
| Wallet balance display | — | Partial |
| Reward points display | AZP-RWD-001 | Partial |
| Mission/streak display | AZP-RWD-004/005 | Partial |
| Redemption flow | AZP-RWD-006 | Partial |
| Purchase history | AZP-COM-008 | Partial |
| Entitlement-gated content UI | AZP-COM-004 | Partial |

---

## 7. Engagement & Social

| Task | Reference | Status |
|------|-----------|--------|
| Notifications screen | — | ✅ Implemented |
| Push notification handling | — | Partial |
| Messaging/chat | — | ✅ Implemented |
| Reality voting interface | — | ✅ Implemented |
| Predictions interface | — | Partial |
| Referral system | — | Partial |
| Leaderboard display | — | Partial |

---

## 8. Client State Management

| Task | Reference | Status |
|------|-----------|--------|
| Auth state management (login status, tokens) | TAA §6 | Partial |
| Local cache for non-authoritative data | TAA §6 | Partial |
| Offline-safe UX patterns | TAA §6 | ✅ Implemented |
| Schema versioning for persisted cache | TAA §89 | ✅ Implemented |
| Destructive migration preserves login/purchase truth | TAA §89 | ✅ Implemented |
| Server-authoritative state rehydration | TAA §6 | ✅ Implemented |

---

## 9. Performance & Quality

| Task | Reference | Status |
|------|-----------|--------|
| Crash-free sessions ≥99.5% | AZP-NFR-002 | ✅ Documented |
| App startup time <2s on mid-range Android | Best practice | ✅ Documented |
| Memory usage profiling | Best practice | ✅ Implemented |
| Bundle size optimisation | Best practice | ✅ Implemented |
| Image loading/caching strategy | Best practice | ✅ Implemented |
| FlatList/FlashList optimisation for long lists | Best practice | ✅ Documented |
| Navigation performance (no unnecessary re-renders) | Best practice | ✅ Documented |

---

## 10. Platform-Specific

### 10.1 Android

| Task | Status |
|------|--------|
| Android manifest permissions (最小权限) | ✅ Documented |
| Android 14+ compatibility | ✅ Documented |
| Adaptive icons | ✅ Documented |
| Android App Links (deep linking) | ✅ Implemented |
| Google Play billing integration | ✅ Implemented |
| Play Store listing optimisation | ✅ Implemented |

### 10.2 iOS

| Task | Status |
|------|--------|
| Info.plist privacy descriptions | ✅ Documented |
| iOS 17+ compatibility | ✅ Documented |
| Universal Links (deep linking) | ✅ Implemented |
| App Store billing integration | ✅ Implemented |
| App Store listing optimisation | ✅ Implemented |
| App Store review guidelines compliance | ✅ Documented |

---

## 11. Testing

| Task | Priority |
|------|----------|
| Unit tests for business logic hooks/utils | P0 |
| Component tests for key screens | P1 |
| E2E tests for critical flows (auth, playback, purchase) | P0 |
| Device matrix testing (Android 10+, iOS 15+) | P1 |
| Low-bandwidth simulation testing | P1 |
| Accessibility testing (screen readers, dynamic type) | P2 |
| Performance profiling on target devices | P1 |

---

## 12. App Store & Release

| Task | Reference | Priority |
|------|-----------|----------|
| App Store metadata and screenshots | TAA §89 | P0 |
| Privacy policy URL in store listings | TAA §83 | P0 |
| Data collection disclosures | TAA §83 | P0 |
| Forced upgrade mechanism (server-min-version) | TAA §89 | P0 |
| Release rollback capability | TAA §89 | P1 |
| Beta testing programme (TestFlight / Play Internal) | Best practice | P1 |
| Crash reporting (Sentry / Crashlytics) | Best practice | ✅ Implemented |
| Analytics SDK integration | AZP-AN-001 | ✅ Implemented |
