/**
 * Admin API type definitions for the Azeebo+ platform.
 * Replaces `any` types in the admin API client methods.
 */

export interface PlatformOverview {
  totalUsers: number;
  totalContent: number;
  totalViews: number;
  dailyActiveUsers: number;
  dailyViews: number;
  totalRevenue: number;
  newUsers: number;
  newContent: number;
  topCreators: {
    id: string;
    name: string;
    contentCount: number;
    views: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    user: string;
    time: string;
  }[];
}

export interface AdminWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreator {
  id: string;
  userId: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  contentCount: number;
  subscriberCount: number;
  isVerified: boolean;
  createdAt: string;
}

export interface PaymentGateway {
  id: string;
  provider: string;
  name: string;
  mode: 'live' | 'test';
  isEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RealityShow {
  id: string;
  title: string;
  description?: string;
  status: 'upcoming' | 'live' | 'ended' | 'cancelled';
  seasonCount: number;
  episodeCount: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ContentReviewItem {
  id: string;
  contentId: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  flaggedReasons: string[];
  creatorName?: string;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  retentionRate: number;
  bounceRate: number;
}

export interface EngagementTrend {
  date: string;
  metric: string;
  value: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface AdminReport {
  id: string;
  name: string;
  description?: string;
  category: string;
  dateRange: string;
  metrics: ReportMetric[];
  dimensions: ReportDimension[];
  filters: ReportFilter[];
  dateField: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportMetric {
  name: string;
  aggregation: string;
  field: string;
}

export interface ReportDimension {
  field: string;
  label: string;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface AdminUniverse {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  isEnabled: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  featureFlags?: FeatureFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  featureKey: string;
  isEnabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  category?: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
