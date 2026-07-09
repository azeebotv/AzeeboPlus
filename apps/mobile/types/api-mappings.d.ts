// API Type Mappings
// Map backend response types to UI expected types

declare module '../../src/api' {
  export interface CreatorContent {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    mediaUrl?: string;
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    views: number;
    likes?: number;
    comments?: number;
    universe?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface CreatorAnalytics {
    totalViews?: number;
    totalLikes?: number;
    totalComments?: number;
    totalFollowers?: number;
    viewsThisWeek?: number;
    viewsThisMonth?: number;
    topContent?: Array<{
      id: string;
      title: string;
      views: number;
      thumbnail?: string;
    }>;
    viewsOverTime?: Array<{ date: string; views: number }>;
  }

  export interface CreatorEarnings {
    totalEarnings?: number;
    pendingEarnings?: number;
    paidEarnings?: number;
    currency?: string;
    earningsHistory?: Array<{ date: string; amount: number; type: string }>;
  }

  export interface CreatorProfile {
    id: string;
    userId: string;
    displayName: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    category?: string;
    contentType?: string;
    socialLinks?: Record<string, string>;
    followers?: number;
    following?: number;
    totalContent?: number;
    isVerified?: boolean;
    createdAt: string;
    updatedAt: string;
  }

  export interface Contestant {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    votes?: number;
    rank?: number;
    eliminated?: boolean;
    episodeId?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface VoteResult {
    contestantId: string;
    contestantName?: string;
    totalVotes?: number;
    percentage?: number;
    rank?: number;
  }
}
