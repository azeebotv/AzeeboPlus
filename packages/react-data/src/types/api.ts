/**
 * API response types for the Azeebo+ mobile app.
 * Replaces `any` usage in API calls with proper type safety.
 */

export interface Movie {
  id: string;
  title: string;
  genre: string;
  rating: string;
  duration?: string;
  director?: string;
  synopsis?: string;
  thumbnail?: string;
  mediaUrl?: string;
  isPremium?: boolean;
  emoji?: string;
}

export interface CastMember {
  id: string;
  name: string;
  role: string;
  emoji?: string;
  avatar?: string;
}

export interface Game {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  difficulty?: string;
  thumbnail?: string;
  isPremium?: boolean;
  highScore?: number;
  emoji?: string;
  yourBest?: number;
}

export interface GameLevel {
  id: string;
  name: string;
  difficulty: string;
  order: number;
  unlocked?: boolean;
  stars?: number;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  name?: string;
  avatar?: string;
  score: number;
  rank: number;
  isYou?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  title?: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  earned?: boolean;
  emoji?: string;
}

export interface Contestant {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  votes: number;
  rank: number;
  eliminated?: boolean;
}

export interface RealityShow {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  viewerCount?: number;
  votingEnds?: string;
  status?: string;
}

export interface Clip {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  mediaUrl?: string;
  duration?: number;
  views?: number;
  likes?: number;
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Creator {
  id: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  subscriberCount?: number;
  totalViews?: number;
  verificationStatus?: string;
}

export interface VotePackage {
  id: string;
  votes: number;
  price: number;
  bonus?: number;
  multiplier?: number;
  label?: string;
  name?: string;
  description?: string;
  isPopular?: boolean;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  bonusBalance?: number;
  promoBalance?: number;
  pendingBalance?: number;
}

export interface PaymentProvider {
  provider: string;
  name: string;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval?: 'monthly' | 'yearly';
  duration?: number;
  features: string[];
  tier?: string;
  isActive?: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  body: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  phone?: string;
  role: string;
  isVerified?: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
