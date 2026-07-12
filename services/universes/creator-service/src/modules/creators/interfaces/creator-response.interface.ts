export interface CreatorProfile {
  id: string;
  displayName: string;
  bio: string;
  avatar: string;
  subscriberCount: number;
  totalViews: number;
  createdAt: Date;
  verified?: boolean;
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
  totalEarnings?: number;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
}
