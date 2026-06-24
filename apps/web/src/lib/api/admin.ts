// Admin domain methods (largest namespace)

import type { RequestClient } from './base';
import type {
  PlatformOverview,
  AdminWallet,
  AdminCreator,
  PaymentGateway,
  RealityShow,
  ContentReviewItem,
  EngagementMetrics,
  EngagementTrend,
  NotificationTemplate,
  NotificationStats,
  AdminReport,
  ReportMetric,
  ReportDimension,
  ReportFilter,
  AdminUniverse,
  FeatureFlag,
  SystemSetting,
} from '../admin-types';
import type { ApiResponse, AnalyticsOverview, ContentItem, PaginatedResponse, User } from './base';

export function createAdminMethods(client: RequestClient) {
  return {
    getDashboard: async (): Promise<
      ApiResponse<{
        totalUsers: number;
        totalContent: number;
        totalViews: number;
        dailyActiveUsers: number;
        dailyViews: number;
        totalRevenue: number;
        newUsers: number;
        newContent: number;
        topCreators: { id: string; name: string; contentCount: number; views: number }[];
        recentActivity: { id: string; action: string; user: string; time: string }[];
      }>
    > => {
      return client.request<{
        totalUsers: number;
        totalContent: number;
        totalViews: number;
        dailyActiveUsers: number;
        dailyViews: number;
        totalRevenue: number;
        newUsers: number;
        newContent: number;
        topCreators: { id: string; name: string; contentCount: number; views: number }[];
        recentActivity: { id: string; action: string; user: string; time: string }[];
      }>('/api/v1/admin/analytics');
    },

    getUsers: async (page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<User>>> => {
      return client.request<PaginatedResponse<User>>(
        `/api/v1/admin/users?page=${page}&limit=${limit}`
      );
    },

    getContent: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/admin/content?page=${page}&limit=${limit}`
      );
    },

    getAnalytics: async (
      startDate?: string,
      endDate?: string
    ): Promise<ApiResponse<AnalyticsOverview>> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return client.request<AnalyticsOverview>(`/api/v1/analytics/kpis?${params.toString()}`);
    },

    // Platform Overview
    getPlatformOverview: async (): Promise<ApiResponse<PlatformOverview>> => {
      return client.request<PlatformOverview>('/api/v1/admin/platform-overview');
    },

    // Wallet Management
    getWallets: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<AdminWallet>>> => {
      return client.request<PaginatedResponse<AdminWallet>>(
        `/api/v1/admin/wallets?page=${page}&limit=${limit}`
      );
    },

    updateWalletStatus: async (
      walletId: string,
      status: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/admin/wallets/${walletId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    // Creator Management
    getCreators: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<AdminCreator>>> => {
      return client.request<PaginatedResponse<AdminCreator>>(
        `/api/v1/admin/creators?page=${page}&limit=${limit}`
      );
    },

    updateCreatorStatus: async (
      creatorId: string,
      status: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/admin/creators/${creatorId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    verifyCreator: async (creatorId: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/admin/creators/${creatorId}/verify`, {
        method: 'POST',
      });
    },

    // Payment Gateway Management
    getPaymentGateways: async (): Promise<ApiResponse<PaymentGateway[]>> => {
      return client.request<PaymentGateway[]>('/api/v1/admin/payment-gateways');
    },

    togglePaymentGateway: async (
      gatewayId: string,
      isEnabled: boolean
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(
        `/api/v1/admin/payment-gateways/${gatewayId}/toggle`,
        {
          method: 'PUT',
          body: JSON.stringify({ isEnabled }),
        }
      );
    },

    updatePaymentGatewayMode: async (
      gatewayId: string,
      mode: 'live' | 'test'
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(
        `/api/v1/admin/payment-gateways/${gatewayId}/mode`,
        {
          method: 'PUT',
          body: JSON.stringify({ mode }),
        }
      );
    },

    // Reality Shows Management
    getRealityShows: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<RealityShow>>> => {
      return client.request<PaginatedResponse<RealityShow>>(
        `/api/v1/admin/reality-shows?page=${page}&limit=${limit}`
      );
    },

    updateRealityShowStatus: async (
      showId: string,
      status: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/admin/reality-shows/${showId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    // Content Review
    getContentReviewQueue: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentReviewItem>>> => {
      return client.request<PaginatedResponse<ContentReviewItem>>(
        `/api/v1/admin/content-review?page=${page}&limit=${limit}`
      );
    },

    approveContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(
        `/api/v1/admin/content-review/${contentId}/approve`,
        {
          method: 'POST',
        }
      );
    },

    rejectContent: async (
      contentId: string,
      reason: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(
        `/api/v1/admin/content-review/${contentId}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }
      );
    },

    // Engagement Monitoring
    getEngagementMetrics: async (): Promise<ApiResponse<EngagementMetrics>> => {
      return client.request<EngagementMetrics>('/api/v1/admin/engagement/metrics');
    },

    getEngagementTrends: async (
      range: '7d' | '30d' | '90d' = '30d'
    ): Promise<ApiResponse<EngagementTrend[]>> => {
      return client.request<EngagementTrend[]>(`/api/v1/admin/engagement/trends?range=${range}`);
    },

    // Notification Management
    getNotificationTemplates: async (): Promise<ApiResponse<NotificationTemplate[]>> => {
      return client.request<NotificationTemplate[]>('/api/v1/admin/notification-templates');
    },

    getNotificationStats: async (): Promise<ApiResponse<NotificationStats>> => {
      return client.request<NotificationStats>('/api/v1/admin/notification-stats');
    },

    createNotificationTemplate: async (template: {
      name: string;
      type: 'email' | 'push' | 'sms' | 'in-app';
      subject: string;
      content: string;
    }): Promise<ApiResponse<NotificationTemplate>> => {
      return client.request<NotificationTemplate>('/api/v1/admin/notification-templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
    },

    updateNotificationTemplate: async (
      templateId: string,
      template: Partial<NotificationTemplate>
    ): Promise<ApiResponse<NotificationTemplate>> => {
      return client.request<NotificationTemplate>(
        `/api/v1/admin/notification-templates/${templateId}`,
        {
          method: 'PUT',
          body: JSON.stringify(template),
        }
      );
    },

    // Reports
    getReports: async (
      range: '7d' | '30d' | '90d' | 'all' = '30d'
    ): Promise<ApiResponse<AdminReport[]>> => {
      return client.request<AdminReport[]>(`/api/v1/admin/reports?range=${range}`);
    },

    // Custom Reports
    getCustomReports: async (): Promise<ApiResponse<AdminReport[]>> => {
      return client.request<AdminReport[]>('/api/v1/reports');
    },

    createCustomReport: async (report: {
      name: string;
      description?: string;
      category: string;
      metrics: ReportMetric[];
      dimensions: ReportDimension[];
      filters: ReportFilter[];
      dateField: string;
      dateRange: string;
      isPublic: boolean;
    }): Promise<ApiResponse<AdminReport>> => {
      return client.request<AdminReport>('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify(report),
      });
    },

    executeReport: async (reportId: string): Promise<ApiResponse<AdminReport>> => {
      return client.request<AdminReport>('/api/v1/reports/execute', {
        method: 'POST',
        body: JSON.stringify({ reportId }),
      });
    },

    deleteCustomReport: async (reportId: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/reports/${reportId}`, {
        method: 'DELETE',
      });
    },

    // Universe Management
    getAllUniverses: async (): Promise<ApiResponse<AdminUniverse[]>> => {
      return client.request<AdminUniverse[]>('/api/v1/admin/universes');
    },

    getUniverseById: async (id: string): Promise<ApiResponse<AdminUniverse>> => {
      return client.request<AdminUniverse>(`/api/v1/admin/universes/${id}`);
    },

    getUniverseByName: async (name: string): Promise<ApiResponse<AdminUniverse>> => {
      return client.request<AdminUniverse>(`/api/v1/admin/universes/name/${name}`);
    },

    createUniverse: async (universe: {
      name: string;
      displayName: string;
      description?: string;
      icon?: string;
      color?: string;
      isEnabled?: boolean;
      sortOrder?: number;
      metadata?: Record<string, unknown>;
    }): Promise<ApiResponse<AdminUniverse>> => {
      return client.request<AdminUniverse>('/api/v1/admin/universes', {
        method: 'POST',
        body: JSON.stringify(universe),
      });
    },

    updateUniverse: async (
      id: string,
      universe: {
        displayName?: string;
        description?: string;
        icon?: string;
        color?: string;
        isEnabled?: boolean;
        sortOrder?: number;
        metadata?: Record<string, unknown>;
      }
    ): Promise<ApiResponse<AdminUniverse>> => {
      return client.request<AdminUniverse>(`/api/v1/admin/universes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(universe),
      });
    },

    deleteUniverse: async (id: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/admin/universes/${id}`, {
        method: 'DELETE',
      });
    },

    toggleUniverse: async (id: string, isEnabled: boolean): Promise<ApiResponse<AdminUniverse>> => {
      return client.request<AdminUniverse>(`/api/v1/admin/universes/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled }),
      });
    },

    updateFeatureFlag: async (
      universeId: string,
      featureFlag: {
        featureKey: string;
        isEnabled: boolean;
        metadata?: Record<string, unknown>;
      }
    ): Promise<ApiResponse<FeatureFlag>> => {
      return client.request<FeatureFlag>(`/api/v1/admin/universes/${universeId}/feature-flags`, {
        method: 'PUT',
        body: JSON.stringify(featureFlag),
      });
    },

    deleteFeatureFlag: async (
      universeId: string,
      featureKey: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(
        `/api/v1/admin/universes/${universeId}/feature-flags/${featureKey}`,
        {
          method: 'DELETE',
        }
      );
    },

    checkFeatureFlag: async (
      universeName: string,
      featureKey: string
    ): Promise<ApiResponse<{ universeName: string; featureKey: string; isEnabled: boolean }>> => {
      return client.request<{ universeName: string; featureKey: string; isEnabled: boolean }>(
        `/api/v1/admin/universes/check/${universeName}/${featureKey}`
      );
    },

    // System Settings Management
    getAllSettings: async (): Promise<ApiResponse<SystemSetting[]>> => {
      return client.request<SystemSetting[]>('/api/v1/admin/settings');
    },

    getPublicSettings: async (): Promise<ApiResponse<SystemSetting[]>> => {
      return client.request<SystemSetting[]>('/api/v1/admin/settings/public');
    },

    getSettingsMap: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/admin/settings/map');
    },

    getSettingsByCategory: async (category: string): Promise<ApiResponse<SystemSetting[]>> => {
      return client.request<SystemSetting[]>(`/api/v1/admin/settings/category/${category}`);
    },

    getSettingByKey: async (key: string): Promise<ApiResponse<SystemSetting>> => {
      return client.request<SystemSetting>(`/api/v1/admin/settings/${key}`);
    },

    getSettingValue: async (key: string): Promise<ApiResponse<{ key: string; value: unknown }>> => {
      return client.request<{ key: string; value: unknown }>(`/api/v1/admin/settings/value/${key}`);
    },

    createSetting: async (setting: {
      key: string;
      value: unknown;
      category?: string;
      description?: string;
      isPublic?: boolean;
    }): Promise<ApiResponse<SystemSetting>> => {
      return client.request<SystemSetting>('/api/v1/admin/settings', {
        method: 'POST',
        body: JSON.stringify(setting),
      });
    },

    updateSetting: async (
      key: string,
      setting: {
        value?: unknown;
        category?: string;
        description?: string;
        isPublic?: boolean;
      }
    ): Promise<ApiResponse<SystemSetting>> => {
      return client.request<SystemSetting>(`/api/v1/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify(setting),
      });
    },

    deleteSetting: async (key: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/admin/settings/${key}`, {
        method: 'DELETE',
      });
    },

    bulkCreateSettings: async (
      settings: Partial<SystemSetting>[]
    ): Promise<ApiResponse<SystemSetting[]>> => {
      return client.request<SystemSetting[]>('/api/v1/admin/settings/bulk', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    },

    bulkUpdateSettings: async (
      settings: { key: string; value: unknown }[]
    ): Promise<ApiResponse<SystemSetting[]>> => {
      return client.request<SystemSetting[]>('/api/v1/admin/settings/bulk', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  };
}
