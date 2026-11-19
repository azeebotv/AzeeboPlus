# Azeebo+ — App Store & Google Play Submission Pack

**Document ID:** AZP-COMM-SUB-2026-v1.0  
**Authority:** Program Steering Committee Decision D-05, PMR §1.3 (Gate G-08), §6.2 (R-13), §8.4 (Item 15), §9.1 (Task 3.5)  
**Target Platforms:** Apple App Store (iOS, iPadOS) & Google Play Store (Android)  
**Build Tooling:** Expo Application Services (EAS Build & Submit)  
**Status:** **IN REVIEW / READY FOR ROLLOUT (Gate G-08 GREEN)**  

---

## 1. Application Metadata & Identifiers

| Parameter | iOS / Apple App Store | Android / Google Play Store |
| :--- | :--- | :--- |
| **App Name** | Azeebo+ | Azeebo+ |
| **Bundle ID / Package Name** | `com.azeebo.plus` | `com.azeebo.plus` |
| **EAS Project ID** | `3627eb83-fb81-4f76-bae5-668a14102705` | `3627eb83-fb81-4f76-bae5-668a14102705` |
| **Primary Category** | Entertainment | Entertainment |
| **Secondary Category** | Video / Media | Media & Video |
| **Age Rating** | 12+ (Infrequent mild violence, contest themes) | Teen (12+) |
| **Support URL** | `https://azeeboplus.com/support` | `https://azeeboplus.com/support` |
| **Marketing URL** | `https://azeeboplus.com` | `https://azeeboplus.com` |
| **Privacy Policy URL** | `https://azeeboplus.com/privacy` | `https://azeeboplus.com/privacy` |
| **Account Deletion URL** | `https://azeeboplus.com/profile/privacy-security` | `https://azeeboplus.com/profile/privacy-security` |

---

## 2. Privacy Manifests & Data Safety Disclosures

### 2.1 Apple Privacy Manifest (`PrivacyInfo.xcprivacy`)
Configured in `apps/mobile/app.json` under `ios.privacyManifests`:
- **Tracking:** `NSPrivacyTracking: false` (Zero third-party cross-app advertising tracking).
- **Tracking Domains:** `NSPrivacyTrackingDomains: []` (None).
- **Collected Data Types:**
  - `NSPrivacyCollectedDataTypeUserID`: Linked to user identity for app functionality and account management.
  - `NSPrivacyCollectedDataTypePurchaseHistory`: Linked to user identity for digital ticket, subscription, and wallet ledger management.
- **Accessed API Types & Required Reasons:**
  - `NSPrivacyAccessedAPICategoryUserDefaults` (Reason `CA92.1`): Local storage of non-sensitive user UI preferences.
  - `NSPrivacyAccessedAPICategoryFileTimestamp` (Reason `C617.1`): Cache management for media assets and downloaded offline clips.

### 2.2 Google Play Data Safety Declaration
- **Data Collected:**
  - Personal Info: Name, Email address, Phone number (for authentication, verification, account management).
  - Financial Info: User payment transaction history (for subscription, wallet, and ticket orders).
  - App Activity: Video interactions, search history, page views (for recommendations and personal library).
- **Data Sharing:** Zero data sold to data brokers; shared solely with payment infrastructure providers (Paystack, Flutterwave) to process transactions.
- **Security Practices:**
  - Data is encrypted in transit over HTTPS (TLS 1.3).
  - Data can be requested for deletion at any time via in-app settings or web portal (`/profile/privacy-security`).

---

## 3. Store Screenshot & Asset Matrix

All assets prepared following official guidelines across canonical display resolutions:
1. **iPhone 6.5" Display (1284 x 2778 px):** 10 curated screens highlighting Cinemaxis premieres, Reality show voting, Comedy sketches, Agbala lore, and Wallet balances.
2. **iPhone 5.5" Display (1242 x 2208 px):** Scaled layout assets formatted for legacy form factors.
3. **iPad Pro 12.9" (2048 x 2732 px):** Multi-column split views showcasing tablet-optimized video player and interactive polls.
4. **Android Phone (1080 x 2400 px):** High-density screenshots formatted for Google Play Store phone listing.
5. **Android Tablet 10" (1920 x 1200 px):** Landscape presentation assets formatted for tablet and foldable displays.

---

## 4. Build Profiles & Release Track Status

Configured in `apps/mobile/eas.json`:
- **iOS TestFlight Track:** Production candidate build uploaded via `eas build --platform ios --profile production` and submitted to TestFlight internal testing pool.
- **Google Play Internal Track:** App bundle (`.aab`) uploaded via `eas build --platform android --profile production` and deployed to Google Play Console Internal Track for stakeholder verification.

**Gate G-08 Status:** **PASSED (Production Candidate Builds Submitted & Verified in Internal Tracks).**
