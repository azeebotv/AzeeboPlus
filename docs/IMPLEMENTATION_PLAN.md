# AZEEBO+ Implementation Plan

## Document Overview
This document provides detailed implementation plans for all 48 missing pages identified in the project analysis. Each page includes technical specifications, component breakdowns, API requirements, and routing structures.

---

## TABLE OF CONTENTS
- [Phase 1: Core User Experience (7 pages)](#phase-1-core-user-experience)
- [Phase 2: Reality Universe (5 pages)](#phase-2-reality-universe)
- [Phase 3: Creator Tools (6 pages)](#phase-3-creator-tools)
- [Phase 4: Admin & Financial (8 pages)](#phase-4-admin--financial)
- [Phase 5: Engagement & Social (7 pages)](#phase-5-engagement--social)
- [Phase 6: Nice-to-Have (5 pages)](#phase-6-nice-to-have)
- [API Endpoint Specifications](#api-endpoint-specifications)
- [Shared Component Specifications](#shared-component-specifications)

---

## CODEBASE CONVENTIONS

### Mobile App (React Native + Expo Router)
- **File Structure**: `apps/mobile/app/[route-group]/page.tsx`
- **Styling**: React Native StyleSheet with design tokens from `@azeebo/design-tokens`
- **State Management**: React hooks + Context API
- **API Calls**: Typed API modules in `apps/mobile/src/api/`
- **Navigation**: Expo Router with typed routes
- **Color Scheme**: Dark mode primary (`#111827` background, `#8B5CF6` primary)

### Web App (Next.js 14 App Router)
- **File Structure**: `apps/web/src/app/[route]/page.tsx`
- **Styling**: Tailwind CSS with design tokens
- **State Management**: React hooks + Context API
- **API Calls**: Typed API modules in `apps/web/src/lib/api.ts`
- **Server Components**: Use `'use client'` directive only when needed

---

# PHASE 1: CORE USER EXPERIENCE

## Page 6 — Reset Password

### Overview
Complete the password reset flow after forgot password. Users enter a new password after receiving a reset token via email/SMS.

### File Locations
- **Mobile**: `apps/mobile/app/(auth)/reset-password.tsx`
- **Web**: `apps/web/src/app/auth/reset-password/page.tsx`

### Mobile Implementation

```typescript
// apps/mobile/app/(auth)/reset-password.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authApi } from '../../src/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculateStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (passwordStrength < 3) {
      Alert.alert('Error', 'Password is too weak');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      Alert.alert('Success', 'Password reset successfully', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // UI Components:
  // - Password input with show/hide toggle
  // - Password strength indicator (5 levels)
  // - Requirements checklist (8+ chars, uppercase, lowercase, number, special char)
  // - Reset button with loading state
  // - Back to login link
}
```

### Web Implementation

```typescript
// apps/web/src/app/auth/reset-password/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  // Similar logic to mobile, using Tailwind CSS for styling
  // Form with password inputs, strength indicator, validation
}
```

### API Requirements
```typescript
// Already exists in apps/mobile/src/api/auth.ts
resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, newPassword });
}
```

### Components Needed
- `PasswordInput` - Reusable password field with show/hide
- `PasswordStrengthMeter` - Visual strength indicator
- `PasswordRequirements` - Checklist of requirements

### Routing Updates
- Add to `apps/mobile/app/(auth)/_layout.tsx`:
  ```typescript
  <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
  ```

---

## Page 7 — Profile Setup

### Overview
Post-registration onboarding step where users complete their profile with photo, bio, interests, and location.

### File Locations
- **Mobile**: `apps/mobile/app/(auth)/profile-setup.tsx`
- **Web**: `apps/web/src/app/auth/profile-setup/page.tsx`

### Mobile Implementation

```typescript
// apps/mobile/app/(auth)/profile-setup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { authApi } from '../../src/api';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const INTERESTS = [
  'Reality TV', 'Movies', 'Music', 'Comedy', 'Sports',
  'Gaming', 'Lifestyle', 'Fashion', 'Food', 'Travel',
  'Technology', 'Business', 'Education', 'Art', 'Culture'
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Basic Info
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Step 2: Details
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [state, setState] = useState('');
  
  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (step === 1) {
      if (!firstName || !lastName) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!state) {
        Alert.alert('Error', 'Please select your state');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setIsLoading(true);
      try {
        await authApi.updateProfile({
          name: `${firstName} ${lastName}`,
          bio: bio || undefined,
          location: state,
          interests: selectedInterests,
        });
        router.replace('/(tabs)/home');
      } catch (error) {
        Alert.alert('Error', 'Failed to save profile');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // UI Components:
  // - Progress bar (Step 1 of 3, Step 2 of 3, Step 3 of 3)
  // - Profile photo upload with camera/gallery options
  // - First/Last name inputs
  // - Bio textarea with character counter (max 150)
  // - Date of birth picker
  // - State selector (dropdown)
  // - Interests multi-select (grid of chips)
  // - Continue/Skip buttons
}
```

### API Requirements
```typescript
// Extend authApi with profile photo upload
uploadProfilePhoto: async (photoUri: string): Promise<ApiResponse<{ photoUrl: string }>> => {
  const formData = new FormData();
  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);
  return apiClient.post<ApiResponse<{ photoUrl: string }>>('/auth/profile/photo', formData);
}
```

### Routing Updates
- Add to `apps/mobile/app/(auth)/_layout.tsx`

---

## Page 8 — Role Selection

### Overview
Allow users to select their role: Regular User, Creator, or Both during onboarding.

### File Locations
- **Mobile**: `apps/mobile/app/(auth)/role-selection.tsx`
- **Web**: `apps/web/src/app/auth/role-selection/page.tsx`

### Implementation Notes
- Three card options with icons and descriptions
- Role affects app experience and navigation
- Can be changed later in settings
- POST to `/auth/role` endpoint

---

## Page 11 — Trending Now

### Overview
Dedicated page showing trending content with time filters (Today/Week/Month/All-time) and universe tabs.

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/trending.tsx`
- **Web**: `apps/web/src/app/trending/page.tsx`

### API Requirements
```typescript
// Add to contentApi
getTrendingContent: async (
  timeFilter: 'today' | 'week' | 'month' | 'all',
  universe?: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<{ items: ContentItem[]; total: number }>> => {
  return apiClient.get(`/content/trending?timeFilter=${timeFilter}&universe=${universe || ''}&page=${page}&limit=${limit}`);
}
```

### Components Needed
- `TimeFilterTabs` - Horizontal tabs for time periods
- `TrendingContentCard` - Card with trend indicator (↑ position)
- `UniverseFilterTabs` - Filter by universe

---

## Page 16 — Recently Watched

### Overview
Watch history with progress bars, resume functionality, and time group headers.

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/recently-watched.tsx`
- **Web**: `apps/web/src/app/library/recent/page.tsx`

### API Requirements
```typescript
// Add to contentApi or create watchHistoryApi
getWatchHistory: async (): Promise<ApiResponse<{
  today: WatchHistoryItem[];
  yesterday: WatchHistoryItem[];
  lastWeek: WatchHistoryItem[];
  older: WatchHistoryItem[];
}>> => {
  return apiClient.get('/watch/history');
}

removeFromHistory: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.delete(`/watch/history/${contentId}`);
}

clearHistory: async (): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.delete('/watch/history');
}
```

---

## Page 43 — Add Funds

### Overview
Fund wallet with payment methods (card, bank transfer, USSD) using Nigerian payment gateways.

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/add-funds.tsx`
- **Web**: `apps/web/src/app/wallet/add-funds/page.tsx`

### Mobile Implementation

```typescript
// apps/mobile/app/(tabs)/add-funds.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { walletApi } from '../../src/api';
import * as Linking from 'expo-linking';

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];
const PAYMENT_PROVIDERS = [
  { id: 'paystack', name: 'Paystack', icon: '💳', methods: ['Card', 'Bank Transfer', 'USSD'] },
  { id: 'flutterwave', name: 'Flutterwave', icon: '🌊', methods: ['Card', 'Bank Transfer', 'USSD'] },
];

export default function AddFundsScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('paystack');
  const [selectedMethod, setSelectedMethod] = useState('Card');
  const [isLoading, setIsLoading] = useState(false);

  const handleFundWallet = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      Alert.alert('Error', 'Minimum amount is ₦100');
      return;
    }

    setIsLoading(true);
    try {
      const response = await walletApi.fundWallet({
        amount: amountNum,
        provider: selectedProvider as 'paystack' | 'flutterwave',
        email: '', // Get from user profile
      });

      if (response.data?.authorizationUrl) {
        await Linking.openURL(response.data.authorizationUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  // UI Components:
  // - Amount input (₦ NGN)
  // - Preset amount buttons (₦1,000, ₦2,000, ₦5,000, etc.)
  // - Payment provider selector (Paystack/Flutterwave)
  // - Payment method selector (Card/Bank Transfer/USSD)
  // - Wallet balance display
  // - Continue button with loading state
}
```

### API Requirements
```typescript
// Already exists in wallet.ts
fundWallet: async (data: {
  amount: number;
  provider: 'paystack' | 'flutterwave';
  email: string;
}): Promise<ApiResponse<{ authorizationUrl: string; reference: string }>>
```

---

## Page 44 — Withdraw Funds

### Overview
Withdraw funds to Nigerian bank accounts or mobile money.

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/withdraw.tsx`
- **Web**: `apps/web/src/app/wallet/withdraw/page.tsx`

### Implementation Notes
- Bank account selector (saved accounts)
- Account number validation (10 digits)
- Bank name dropdown (Nigerian banks)
- Amount input with minimum/maximum limits
- Withdrawal fee display
- Wallet balance display
- Confirmation modal

### API Requirements
```typescript
// Already exists in wallet.ts
withdraw: async (data: {
  amount: number;
  bankCode: string;
  accountNumber: string;
}): Promise<ApiResponse<{ message: string }>>

// Add new endpoints
getSavedBanks: async (): Promise<ApiResponse<{ banks: BankAccount[] }>> => {
  return apiClient.get('/wallet/banks');
}

resolveAccount: async (accountNumber: string, bankCode: string): Promise<ApiResponse<{ accountName: string }>> => {
  return apiClient.post('/wallet/resolve-account', { accountNumber, bankCode });
}
```

---

## Page 49 — Subscription Plans

### Overview
Display premium subscription plans with NGN pricing and feature comparison.

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/subscription-plans.tsx`
- **Web**: `apps/web/src/app/subscription/page.tsx`

### Implementation Notes
- Plan cards (Basic, Premium, VIP)
- Feature comparison table
- Monthly/Annual pricing toggle
- Current plan indicator
- Subscribe button per plan
- Payment method selection

### API Requirements
```typescript
// Add to subscriptionApi
getPlans: async (): Promise<ApiResponse<{
  plans: Array<{
    id: string;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
    isPopular: boolean;
  }>;
}>> => {
  return apiClient.get('/subscription/plans');
}

subscribe: async (planId: string, billingCycle: 'monthly' | 'annual'): Promise<ApiResponse<{ authorizationUrl: string }>> => {
  return apiClient.post('/subscription/subscribe', { planId, billingCycle });
}
```

---

# PHASE 2: REALITY UNIVERSE

## Page 19 — Episodes

### Overview
Episode list with season selector, air dates (WAT), availability status.

### File Locations
- **Mobile**: `apps/mobile/app/reality/[showId]/episodes.tsx`
- **Web**: `apps/web/src/app/reality/[showId]/episodes/page.tsx`

### API Requirements
```typescript
// Add to realityApi or contentApi
getEpisodes: async (showId: string, season?: number): Promise<ApiResponse<{
  episodes: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    description: string;
    airDate: string;
    duration: number;
    thumbnail: string;
    status: 'available' | 'coming-soon' | 'locked';
    isPremium: boolean;
  }>;
  seasons: number[];
}>> => {
  return apiClient.get(`/reality/${showId}/episodes?season=${season || ''}`);
}
```

---

## Page 20 — Episode Player

### Overview
Full video player with quality selector, subtitles (English/Yoruba/Hausa), rewards badge.

### File Locations
- **Mobile**: `apps/mobile/app/reality/[showId]/episodes/[episodeId].tsx`
- **Web**: `apps/web/src/app/reality/[showId]/episodes/[episodeId]/page.tsx`

### Components Needed
- `VideoPlayer` - Extended player with controls
- `QualitySelector` - 360p/480p/720p/1080p options
- `SubtitleSelector` - Language options
- `RewardsBadge` - Display earned rewards

### API Requirements
```typescript
getEpisodeStream: async (episodeId: string): Promise<ApiResponse<{
  streamUrl: string;
  subtitles: Array<{ language: string; url: string }>;
  qualities: Array<{ quality: string; url: string }>;
}>> => {
  return apiClient.get(`/reality/episodes/${episodeId}/stream`);
}
```

---

## Page 21 — Contestant Profile

### Overview
Individual contestant pages with bio, vote count, social links, favorite moments.

### File Locations
- **Mobile**: `apps/mobile/app/reality/[showId]/contestants/[contestantId].tsx`
- **Web**: `apps/web/src/app/reality/[showId]/contestants/[contestantId]/page.tsx`

### API Requirements
```typescript
getContestant: async (showId: string, contestantId: string): Promise<ApiResponse<{
  contestant: {
    id: string;
    name: string;
    age: number;
    bio: string;
    photo: string;
    voteCount: number;
    ranking: number;
    socialMedia: { instagram?: string; twitter?: string; whatsapp?: string };
    journey: string;
    favoriteMoments: Array<{ id: string; title: string; thumbnail: string }>;
  };
}>> => {
  return apiClient.get(`/reality/${showId}/contestants/${contestantId}`);
}
```

---

## Page 23 — Super Vote

### Overview
Premium voting feature with 2x weight, 5x visibility, pricing in NGN.

### File Locations
- **Mobile**: `apps/mobile/app/reality/[showId]/super-vote.tsx`
- **Web**: `apps/web/src/app/reality/[showId]/super-vote/page.tsx`

### Implementation Notes
- Super Vote banner with premium badge
- Contestant selection cards
- Quantity selector (1-100+)
- Pricing display (₦ NGN per super vote)
- Wallet balance display
- Total cost calculation
- Purchase confirmation

### API Requirements
```typescript
purchaseSuperVote: async (data: {
  showId: string;
  contestantId: string;
  quantity: number;
}): Promise<ApiResponse<{ message: string; totalCost: number }>> => {
  return apiClient.post('/reality/super-vote', data);
}
```

---

## Page 30 — Results

### Overview
Show results with winner announcement, eliminated contestants, statistics.

### File Locations
- **Mobile**: `apps/mobile/app/reality/[showId]/results.tsx`
- **Web**: `apps/web/src/app/reality/[showId]/results/page.tsx`

### API Requirements
```typescript
getShowResults: async (showId: string): Promise<ApiResponse<{
  winner: Contestant;
  runnersUp: Contestant[];
  eliminatedContestants: Array<{ contestant: Contestant; eliminationOrder: number }>;
  statistics: {
    totalVotes: number;
    totalViewers: number;
    peakViewerCount: number;
  };
  nextEpisode?: { airDate: string; preview: string };
}>> => {
  return apiClient.get(`/reality/${showId}/results`);
}
```

---

# PHASE 3: CREATOR TOOLS

## Page 33 — Content Manager

### Overview
Full content management with grid/list view, bulk actions, filters.

### File Locations
- **Mobile**: `apps/mobile/app/creators/content-manager.tsx`
- **Web**: `apps/web/src/app/creators/content/page.tsx`

### API Requirements
```typescript
// Add to creatorApi
getContent: async (filters: {
  status?: 'published' | 'draft' | 'scheduled' | 'archived';
  sortBy?: 'date' | 'views' | 'engagement' | 'earnings';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  items: ContentItem[];
  total: number;
  page: number;
  totalPages: number;
}>> => {
  const params = new URLSearchParams(filters as any);
  return apiClient.get(`/creator/content?${params}`);
}

bulkAction: async (action: 'delete' | 'archive' | 'publish', contentIds: string[]): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.post('/creator/content/bulk', { action, contentIds });
}
```

---

## Page 34 — Drafts

### Overview
Draft management with auto-save, continue editing, template options.

### File Locations
- **Mobile**: `apps/mobile/app/creators/drafts.tsx`
- **Web**: `apps/web/src/app/creators/drafts/page.tsx`

---

## Page 35 — Published Content

### Overview
Published content list with analytics, earnings display in NGN.

### File Locations
- **Mobile**: `apps/mobile/app/creators/published.tsx`
- **Web**: `apps/web/src/app/creators/published/page.tsx`

---

## Page 36 — Scheduled Posts

### Overview
Calendar view, countdown timers, reschedule options.

### File Locations
- **Mobile**: `apps/mobile/app/creators/scheduled.tsx`
- **Web**: `apps/web/src/app/creators/scheduled/page.tsx`

---

## Page 37 — Creator Analytics

### Overview
Detailed analytics with charts, demographics, earnings over time.

### File Locations
- **Mobile**: `apps/mobile/app/creators/analytics.tsx`
- **Web**: `apps/web/src/app/creators/analytics/page.tsx`

### Components Needed
- `AnalyticsChart` - Line/bar charts (use react-native-chart-kit or recharts)
- `DemographicsCard` - Age/gender/location breakdown
- `PerformanceTable` - Content performance metrics

### API Requirements
```typescript
getAnalytics: async (period: '7d' | '30d' | '90d' | 'custom'): Promise<ApiResponse<{
  totalViews: number;
  totalEngagement: number;
  followersGained: number;
  totalEarnings: number;
  viewsOverTime: Array<{ date: string; views: number }>;
  engagementOverTime: Array<{ date: string; engagement: number }>;
  topContent: Array<{ id: string; title: string; views: number; engagement: number }>;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    gender: Array<{ type: string; percentage: number }>;
    locations: Array<{ state: string; percentage: number }>;
  };
}>> => {
  return apiClient.get(`/creator/analytics?period=${period}`);
}
```

---

## Page 39 — Earnings Dashboard

### Overview
Earnings breakdown by source, payout status, transaction history in NGN.

### File Locations
- **Mobile**: `apps/mobile/app/creators/earnings.tsx`
- **Web**: `apps/web/src/app/creators/earnings/page.tsx`

### API Requirements
```typescript
getEarnings: async (period: 'month' | 'all' | 'custom'): Promise<ApiResponse<{
  totalEarnings: number;
  breakdown: {
    tips: number;
    subscriptions: number;
    contentUnlock: number;
    challenges: number;
    referrals: number;
  };
  pendingPayout: number;
  estimatedPayoutDate: string;
  earningsOverTime: Array<{ date: string; amount: number }>;
  topEarningContent: Array<{ id: string; title: string; earnings: number }>;
}>> => {
  return apiClient.get(`/creator/earnings?period=${period}`);
}

withdrawEarnings: async (amount: number): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.post('/creator/earnings/withdraw', { amount });
}
```

---

## Page 40 — Monetization Settings

### Overview
Tips, subscriptions, content unlock, referral settings with NGN pricing.

### File Locations
- **Mobile**: `apps/mobile/app/creators/monetization-settings.tsx`
- **Web**: `apps/web/src/app/creators/monetization/page.tsx`

---

## Page 41 — Creator Profile

### Overview
Public creator profile page with content feed, stats, follow button.

### File Locations
- **Mobile**: `apps/mobile/app/creators/[creatorId].tsx`
- **Web**: `apps/web/src/app/creators/[creatorId]/page.tsx`

---

# PHASE 4: ADMIN & FINANCIAL

## Page 67 — Creator Management

### Overview
Admin view of creators, verification, performance metrics.

### File Locations
- **Web**: `apps/web/src/app/admin/creators/page.tsx`

### API Requirements
```typescript
// Admin API endpoints
adminGetCreators: async (filters: {
  status?: 'pending' | 'verified' | 'suspended';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  items: Creator[];
  total: number;
}>> => {
  return apiClient.get(`/admin/creators?${new URLSearchParams(filters as any)}`);
}

adminVerifyCreator: async (creatorId: string): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.post(`/admin/creators/${creatorId}/verify`);
}

adminSuspendCreator: async (creatorId: string, reason: string): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.post(`/admin/creators/${creatorId}/suspend`, { reason });
}
```

---

## Page 69 — Financial Monitoring

### Overview
Platform-wide financial overview, transaction monitoring in NGN.

### File Locations
- **Web**: `apps/web/src/app/admin/financial/page.tsx`

---

## Page 70 — Reports & Analytics

### Overview
Platform analytics, user growth, revenue reports.

### File Locations
- **Web**: `apps/web/src/app/admin/reports/page.tsx`

---

## Page 71 — Reality Management

### Overview
Manage reality shows, contestants, voting, episodes.

### File Locations
- **Web**: `apps/web/src/app/admin/reality/page.tsx`

---

## Page 76 — Payment Gateway Settings

### Overview
Payment provider configuration, NGN settings, webhooks.

### File Locations
- **Web**: `apps/web/src/app/admin/payment-gateway/page.tsx`

---

## Page 77 — Wallet Management

### Overview
User wallet oversight, manual adjustments, fraud detection.

### File Locations
- **Web**: `apps/web/src/app/admin/wallets/page.tsx`

---

## Page 78 — Content Review Queue

### Overview
Pending content review, approval/rejection workflow.

### File Locations
- **Web**: `apps/web/src/app/admin/content-review/page.tsx`

---

## Page 80 — Platform Overview

### Overview
Executive dashboard with KPIs, health metrics, alerts.

### File Locations
- **Web**: `apps/web/src/app/admin/overview/page.tsx`

---

# PHASE 5: ENGAGEMENT & SOCIAL

## Page 25 — Prediction Results

### File Locations
- **Mobile**: `apps/mobile/app/predictions/[predictionId]/results.tsx`
- **Web**: `apps/web/src/app/predictions/[predictionId]/results/page.tsx`

---

## Page 26 — Leaderboard

### File Locations
- **Mobile**: `apps/mobile/app/leaderboard.tsx`
- **Web**: `apps/web/src/app/leaderboard/page.tsx`

---

## Page 29 — Live Chat

### File Locations
- **Mobile**: `apps/mobile/app/reality/[showId]/live-chat.tsx`
- **Web**: Component within live show page

---

## Page 45 — Transactions

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/transactions.tsx`
- **Web**: `apps/web/src/app/wallet/transactions/page.tsx`

---

## Page 48 — Referral System

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/referral.tsx`
- **Web**: `apps/web/src/app/referral/page.tsx`

---

## Page 50 — Premium Access

### File Locations
- **Mobile**: `apps/mobile/app/premium.tsx`
- **Web**: `apps/web/src/app/premium/page.tsx`

---

## Page 57 — Messages

### File Locations
- **Mobile**: `apps/mobile/app/messages.tsx`
- **Web**: `apps/web/src/app/messages/page.tsx`

---

# PHASE 6: NICE-TO-HAVE

## Page 27 — Rankings

### File Locations
- **Mobile**: `apps/mobile/app/rankings.tsx`
- **Web**: `apps/web/src/app/rankings/page.tsx`

---

## Page 46 — Transaction Details

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/transactions/[id].tsx`
- **Web**: `apps/web/src/app/wallet/transactions/[id]/page.tsx`

---

## Page 56 — Recommendations

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/recommendations.tsx`
- **Web**: `apps/web/src/app/recommendations/page.tsx`

---

## Page 59 — Edit Profile

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/edit-profile.tsx`
- **Web**: `apps/web/src/app/profile/edit/page.tsx`

---

## Page 61 — Privacy & Security

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/privacy-security.tsx`
- **Web**: `apps/web/src/app/settings/privacy/page.tsx`

---

## Page 62 — Device Management

### File Locations
- **Mobile**: `apps/mobile/app/(tabs)/device-management.tsx`
- **Web**: `apps/web/src/app/settings/devices/page.tsx`

---

## Page 72 — System Settings

### File Locations
- **Web**: `apps/web/src/app/admin/system-settings/page.tsx`

---

## Page 73 — Audit Logs

### File Locations
- **Web**: `apps/web/src/app/admin/audit-logs/page.tsx`

---

## Page 74 — Announcement Center

### File Locations
- **Web**: `apps/web/src/app/admin/announcements/page.tsx`

---

## Page 75 — Notification Management

### File Locations
- **Web**: `apps/web/src/app/admin/notifications/page.tsx`

---

## Page 79 — Engagement Monitoring

### File Locations
- **Web**: `apps/web/src/app/admin/engagement/page.tsx`

---

# API ENDPOINT SPECIFICATIONS

## Authentication Endpoints
```
POST   /auth/reset-password          - Reset password with token
POST   /auth/role                    - Set user role
GET    /auth/me                      - Get user profile
PATCH  /auth/me                      - Update user profile
POST   /auth/profile/photo           - Upload profile photo
```

## Content Endpoints
```
GET    /content/trending             - Get trending content
GET    /content/recent               - Get recently watched
DELETE /watch/history                - Clear watch history
DELETE /watch/history/:id            - Remove from history
```

## Reality Endpoints
```
GET    /reality/:showId/episodes     - Get episodes list
GET    /reality/episodes/:id/stream  - Get episode stream URL
GET    /reality/:showId/contestants/:id - Get contestant profile
POST   /reality/super-vote           - Purchase super votes
GET    /reality/:showId/results      - Get show results
```

## Wallet Endpoints
```
GET    /wallet/balance               - Get wallet balance
GET    /wallet/transactions          - Get transaction history
POST   /wallet/fund                  - Initiate wallet funding
POST   /wallet/withdraw              - Request withdrawal
GET    /wallet/banks                 - Get saved bank accounts
POST   /wallet/resolve-account      - Resolve bank account name
```

## Creator Endpoints
```
GET    /creator/content              - Get creator content
POST   /creator/content/bulk         - Bulk content actions
GET    /creator/analytics            - Get analytics data
GET    /creator/earnings             - Get earnings data
POST   /creator/earnings/withdraw    - Withdraw earnings
GET    /creator/monetization         - Get monetization settings
PUT    /creator/monetization         - Update monetization settings
```

## Subscription Endpoints
```
GET    /subscription/plans           - Get subscription plans
POST   /subscription/subscribe       - Subscribe to plan
GET    /subscription/status          - Get subscription status
DELETE /subscription/cancel          - Cancel subscription
```

## Admin Endpoints
```
GET    /admin/creators               - Get all creators
POST   /admin/creators/:id/verify    - Verify creator
POST   /admin/creators/:id/suspend   - Suspend creator
GET    /admin/financial              - Get financial overview
GET    /admin/reports                - Get platform reports
GET    /admin/reality                - Get reality shows
PUT    /admin/reality/:id            - Update reality show
GET    /admin/payment-gateway        - Get payment settings
PUT    /admin/payment-gateway        - Update payment settings
GET    /admin/wallets                - Get all wallets
POST   /admin/wallets/:id/adjust     - Manual wallet adjustment
GET    /admin/content-review         - Get content review queue
POST   /admin/content-review/:id/approve  - Approve content
POST   /admin/content-review/:id/reject   - Reject content
GET    /admin/overview               - Get platform overview
GET    /admin/system-settings        - Get system settings
PUT    /admin/system-settings        - Update system settings
GET    /admin/audit-logs             - Get audit logs
POST   /admin/announcements          - Create announcement
GET    /admin/notifications          - Get notification templates
PUT    /admin/notifications/:id      - Update notification template
GET    /admin/engagement             - Get engagement metrics
```

## Social Endpoints
```
GET    /leaderboard                  - Get leaderboard
GET    /predictions/:id/results      - Get prediction results
GET    /messages                     - Get messages
POST   /messages                     - Send message
GET    /referral                     - Get referral info
POST   /referral/generate            - Generate referral code
```

---

# SHARED COMPONENT SPECIFICATIONS

## Mobile Components

### StateContainers
```typescript
// apps/mobile/src/components/StateContainers.tsx
// Already exists - LoadingState, ErrorState, EmptyState
```

### New Components Needed

```typescript
// PasswordInput - Reusable password field
interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

// PasswordStrengthMeter
interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

// AmountInput - Currency input with NGN formatting
interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency?: 'NGN';
  presetAmounts?: number[];
}

// ContentCard - Reusable content card
interface ContentCardProps {
  item: ContentItem;
  onPress: () => void;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showProgress?: boolean;
  progress?: number;
}

// Chart components
interface AnalyticsChartProps {
  data: Array<{ date: string; value: number }>;
  type: 'line' | 'bar';
  color?: string;
}
```

## Web Components

### Already Exists
- ErrorBoundary
- SeoMeta
- Skeleton

### New Components Needed
Similar to mobile but using Tailwind CSS and web-specific libraries (recharts for charts, etc.)

---

# IMPLEMENTATION CHECKLIST

## Phase 1: Core User Experience
- [ ] Page 6 — Reset Password
- [ ] Page 7 — Profile Setup
- [ ] Page 8 — Role Selection
- [ ] Page 11 — Trending Now
- [ ] Page 16 — Recently Watched
- [ ] Page 43 — Add Funds
- [ ] Page 44 — Withdraw Funds
- [ ] Page 49 — Subscription Plans

## Phase 2: Reality Universe
- [ ] Page 19 — Episodes
- [ ] Page 20 — Episode Player
- [ ] Page 21 — Contestant Profile
- [ ] Page 23 — Super Vote
- [ ] Page 30 — Results

## Phase 3: Creator Tools
- [ ] Page 33 — Content Manager
- [ ] Page 34 — Drafts
- [ ] Page 35 — Published Content
- [ ] Page 36 — Scheduled Posts
- [ ] Page 37 — Creator Analytics
- [ ] Page 39 — Earnings Dashboard
- [ ] Page 40 — Monetization Settings
- [ ] Page 41 — Creator Profile

## Phase 4: Admin & Financial
- [ ] Page 67 — Creator Management
- [ ] Page 69 — Financial Monitoring
- [ ] Page 70 — Reports & Analytics
- [ ] Page 71 — Reality Management
- [ ] Page 76 — Payment Gateway Settings
- [ ] Page 77 — Wallet Management
- [ ] Page 78 — Content Review Queue
- [ ] Page 80 — Platform Overview

## Phase 5: Engagement & Social
- [ ] Page 25 — Prediction Results
- [ ] Page 26 — Leaderboard
- [ ] Page 29 — Live Chat
- [ ] Page 45 — Transactions
- [ ] Page 48 — Referral System
- [ ] Page 50 — Premium Access
- [ ] Page 57 — Messages

## Phase 6: Nice-to-Have
- [ ] Page 27 — Rankings
- [ ] Page 46 — Transaction Details
- [ ] Page 56 — Recommendations
- [ ] Page 59 — Edit Profile
- [ ] Page 61 — Privacy & Security
- [ ] Page 62 — Device Management
- [ ] Page 72 — System Settings
- [ ] Page 73 — Audit Logs
- [ ] Page 74 — Announcement Center
- [ ] Page 75 — Notification Management
- [ ] Page 79 — Engagement Monitoring

---

# NEXT STEPS

1. **Review this document** with the team to prioritize pages
2. **Set up API endpoints** on the backend before frontend implementation
3. **Create shared components** first (PasswordInput, AmountInput, ContentCard, etc.)
4. **Implement Phase 1** pages (Core User Experience)
5. **Test thoroughly** before moving to next phase
6. **Update miss-pages.md** as pages are completed
7. **Create user stories/tickets** for each page implementation

---

# ESTIMATED EFFORT

| Phase | Pages | Mobile Effort | Web Effort | Total Effort |
|-------|-------|---------------|------------|--------------|
| Phase 1 | 8 | 3-4 days | 2-3 days | 5-7 days |
| Phase 2 | 5 | 4-5 days | 3-4 days | 7-9 days |
| Phase 3 | 8 | 6-8 days | 5-6 days | 11-14 days |
| Phase 4 | 8 | N/A | 8-10 days | 8-10 days |
| Phase 5 | 7 | 4-5 days | 3-4 days | 7-9 days |
| Phase 6 | 11 | 4-5 days | 5-6 days | 9-11 days |
| **Total** | **47** | **21-27 days** | **26-33 days** | **47-60 days** |

*Note: Estimates assume 1-2 developers working full-time on implementation*
