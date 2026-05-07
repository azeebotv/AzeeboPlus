export interface CreatorProfile {
  id: string;
  displayName: string;
  bio: string;
  avatar: string;
  subscriberCount: number;
  totalViews: number;
  createdAt: Date;
}

export interface CreatorUpload {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  status: string;
  viewCount: number;
  createdAt: Date;
}

export interface CreatorEarnings {
  total: number;
  pending: number;
  paid: number;
  currency: string;
}

export interface CreatorAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
}

export interface CreatorResponse {
  success: boolean;
  data?: {
    user?: Record<string, unknown>;
    profile?: CreatorProfile;
    profiles?: CreatorProfile[];
    uploads?: CreatorUpload[];
    earnings?: CreatorEarnings;
    analytics?: CreatorAnalytics;
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
