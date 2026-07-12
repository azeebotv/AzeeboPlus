import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAdminMethods } from '../admin';
import type { RequestClient } from '../base';

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Admin API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let admin: ReturnType<typeof createAdminMethods>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createMockClient();
    admin = createAdminMethods(client);
  });

  // ── Dashboard ──────────────────────────────────────────────────────────
  describe('getDashboard', () => {
    it('should fetch admin analytics dashboard', async () => {
      const dashboard = {
        totalUsers: 15000,
        totalContent: 3200,
        totalViews: 1200000,
        dailyActiveUsers: 850,
        dailyViews: 45000,
        totalRevenue: 250000,
        newUsers: 120,
        newContent: 35,
        topCreators: [{ id: 'c1', name: 'Creator One', contentCount: 50, views: 100000 }],
        recentActivity: [
          { id: 'a1', action: 'content.published', user: 'User1', time: '2026-07-01' },
        ],
      };
      client.request.mockResolvedValue({ success: true, data: dashboard });

      const result = await admin.getDashboard();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/dashboard/stats');
      expect(result.success).toBe(true);
      expect(result.data!.totalUsers).toBe(15000);
      expect(result.data!.topCreators).toHaveLength(1);
    });
  });

  // ── Users ──────────────────────────────────────────────────────────────
  describe('getUsers', () => {
    it('should fetch paginated users with defaults', async () => {
      const paginated = {
        items: [{ id: 'u1', email: 'u1@test.com', name: 'User1', role: 'user' }],
        total: 100,
        page: 1,
        limit: 20,
        hasMore: true,
      };
      client.request.mockResolvedValue({ success: true, data: paginated });

      const result = await admin.getUsers();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/users?page=1&limit=20');
      expect(result.data!.items).toHaveLength(1);
      expect(result.data!.total).toBe(100);
    });

    it('should fetch paginated users with custom page/limit', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 3, limit: 50, hasMore: false },
      });

      await admin.getUsers(3, 50);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/users?page=3&limit=50');
    });
  });

  // ── Content ────────────────────────────────────────────────────────────
  describe('getContent', () => {
    it('should fetch paginated content', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 'c1', title: 'Video 1' }],
          total: 50,
          page: 1,
          limit: 20,
          hasMore: true,
        },
      });

      const result = await admin.getContent();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/content?page=1&limit=20');
      expect(result.data!.items).toHaveLength(1);
    });
  });

  // ── Analytics ──────────────────────────────────────────────────────────
  describe('getAnalytics', () => {
    it('should fetch analytics without date filters', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { users: [], content: [], revenue: [] },
      });

      await admin.getAnalytics();

      expect(client.request).toHaveBeenCalledWith('/api/v1/analytics/kpis?');
    });

    it('should fetch analytics with start and end dates', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { users: [], content: [], revenue: [] },
      });

      await admin.getAnalytics('2026-01-01', '2026-06-30');

      const calledUrl = client.request.mock.calls[0][0];
      expect(calledUrl).toContain('startDate=2026-01-01');
      expect(calledUrl).toContain('endDate=2026-06-30');
    });

    it('should fetch analytics with only startDate', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { users: [], content: [], revenue: [] },
      });

      await admin.getAnalytics('2026-01-01');

      const calledUrl = client.request.mock.calls[0][0];
      expect(calledUrl).toContain('startDate=2026-01-01');
      expect(calledUrl).not.toContain('endDate');
    });
  });

  // ── Platform Overview ──────────────────────────────────────────────────
  describe('getPlatformOverview', () => {
    it('should fetch platform overview', async () => {
      client.request.mockResolvedValue({ success: true, data: { totalUsers: 1000 } });

      await admin.getPlatformOverview();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/dashboard/platform-overview');
    });
  });

  // ── Wallet Management ─────────────────────────────────────────────────
  describe('getWallets', () => {
    it('should fetch paginated wallets', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      });

      await admin.getWallets();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/wallets?page=1&limit=20');
    });
  });

  describe('updateWalletStatus', () => {
    it('should update wallet status via PUT', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Wallet updated' } });

      const result = await admin.updateWalletStatus('w1', 'suspended');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/wallets/w1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: 'suspended' }),
      });
      expect(result.data!.message).toBe('Wallet updated');
    });
  });

  // ── Creator Management ────────────────────────────────────────────────
  describe('getCreators', () => {
    it('should fetch paginated creators', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      });

      await admin.getCreators();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/users?page=1&limit=20&role=creator');
    });
  });

  describe('updateCreatorStatus', () => {
    it('should update creator status', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Creator updated' } });

      await admin.updateCreatorStatus('cr1', 'approved');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/users/cr1/role', {
        method: 'PUT',
        body: JSON.stringify({ role: 'creator' }),
      });
    });
  });

  describe('verifyCreator', () => {
    it('should verify a creator via POST', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Creator verified' } });

      await admin.verifyCreator('cr1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/users/cr1/role', {
        method: 'PUT',
        body: JSON.stringify({ role: 'creator' }),
      });
    });
  });

  // ── Payment Gateways ──────────────────────────────────────────────────
  describe('getPaymentGateways', () => {
    it('should fetch payment gateways', async () => {
      client.request.mockResolvedValue({ success: true, data: [{ id: 'pg1', name: 'Stripe' }] });

      await admin.getPaymentGateways();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/payment-gateways');
    });
  });

  describe('togglePaymentGateway', () => {
    it('should toggle payment gateway enabled state', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Toggled' } });

      await admin.togglePaymentGateway('pg1', true);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/payment-gateways/pg1/toggle', {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: true }),
      });
    });
  });

  describe('updatePaymentGatewayMode', () => {
    it('should switch gateway mode to live', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Mode updated' } });

      await admin.updatePaymentGatewayMode('pg1', 'live');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/payment-gateways/pg1/mode', {
        method: 'PUT',
        body: JSON.stringify({ mode: 'live' }),
      });
    });

    it('should switch gateway mode to test', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Mode updated' } });

      await admin.updatePaymentGatewayMode('pg1', 'test');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/payment-gateways/pg1/mode', {
        method: 'PUT',
        body: JSON.stringify({ mode: 'test' }),
      });
    });
  });

  // ── Reality Shows ─────────────────────────────────────────────────────
  describe('getRealityShows', () => {
    it('should fetch paginated reality shows', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      });

      await admin.getRealityShows();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reality-shows?page=1&limit=20');
    });
  });

  describe('updateRealityShowStatus', () => {
    it('should update reality show status', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Updated' } });

      await admin.updateRealityShowStatus('rs1', 'active');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reality-shows/rs1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: 'active' }),
      });
    });
  });

  // ── Content Review ────────────────────────────────────────────────────
  describe('getContentReviewQueue', () => {
    it('should fetch content review queue', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      });

      await admin.getContentReviewQueue();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/content-review?page=1&limit=20');
    });
  });

  describe('approveContent', () => {
    it('should approve content via POST', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Content approved' } });

      await admin.approveContent('c1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/content-review/c1/approve', {
        method: 'POST',
      });
    });
  });

  describe('rejectContent', () => {
    it('should reject content with reason', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Content rejected' } });

      await admin.rejectContent('c1', 'Violates community guidelines');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/content-review/c1/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Violates community guidelines' }),
      });
    });
  });

  // ── Engagement Monitoring ─────────────────────────────────────────────
  describe('getEngagementMetrics', () => {
    it('should fetch engagement metrics', async () => {
      client.request.mockResolvedValue({ success: true, data: { totalViews: 100000 } });

      await admin.getEngagementMetrics();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/engagement/metrics');
    });
  });

  describe('getEngagementTrends', () => {
    it('should fetch engagement trends with default range', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getEngagementTrends();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/engagement/trends?range=30d');
    });

    it('should fetch engagement trends with 7d range', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getEngagementTrends('7d');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/engagement/trends?range=7d');
    });

    it('should fetch engagement trends with 90d range', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getEngagementTrends('90d');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/engagement/trends?range=90d');
    });
  });

  // ── Notification Management ───────────────────────────────────────────
  describe('getNotificationTemplates', () => {
    it('should fetch notification templates', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: [{ id: 't1', name: 'Welcome Email' }],
      });

      await admin.getNotificationTemplates();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/notification-templates');
    });
  });

  describe('getNotificationStats', () => {
    it('should fetch notification stats', async () => {
      client.request.mockResolvedValue({ success: true, data: { sent: 5000, opened: 2500 } });

      await admin.getNotificationStats();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/notifications/stats');
    });
  });

  describe('createNotificationTemplate', () => {
    it('should create a notification template', async () => {
      const template = { name: 'Test', type: 'email' as const, subject: 'Hello', content: 'Body' };
      client.request.mockResolvedValue({ success: true, data: { id: 't2', ...template } });

      await admin.createNotificationTemplate(template);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/notification-templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
    });
  });

  describe('updateNotificationTemplate', () => {
    it('should update a notification template', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: 't1', name: 'Updated' } });

      await admin.updateNotificationTemplate('t1', { name: 'Updated' });

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/notification-templates/t1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });
    });
  });

  // ── Reports ───────────────────────────────────────────────────────────
  describe('getReports', () => {
    it('should fetch reports with default range', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getReports();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reports?range=30d');
    });

    it('should fetch reports with all range', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getReports('all');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reports?range=all');
    });
  });

  describe('Custom Reports', () => {
    it('should fetch custom reports', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getCustomReports();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reports');
    });

    it('should create a custom report', async () => {
      const report = {
        name: 'Monthly Revenue',
        category: 'financial',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metrics: [] as any[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dimensions: [] as any[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filters: [] as any[],
        dateField: 'createdAt',
        dateRange: '30d',
        isPublic: false,
      };
      client.request.mockResolvedValue({ success: true, data: { id: 'r1', ...report } });

      await admin.createCustomReport(report);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reports', {
        method: 'POST',
        body: JSON.stringify(report),
      });
    });

    it('should execute a custom report', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: 'r1', status: 'completed' } });

      await admin.executeReport('r1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reports/execute', {
        method: 'POST',
        body: JSON.stringify({ reportId: 'r1' }),
      });
    });

    it('should delete a custom report', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Deleted' } });

      await admin.deleteCustomReport('r1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/reports/r1', {
        method: 'DELETE',
      });
    });
  });

  // ── Universe Management ───────────────────────────────────────────────
  describe('getAllUniverses', () => {
    it('should fetch all universes', async () => {
      client.request.mockResolvedValue({ success: true, data: [{ id: 'u1', name: 'nollywood' }] });

      await admin.getAllUniverses();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes');
    });
  });

  describe('getUniverseById', () => {
    it('should fetch universe by ID', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: 'u1', name: 'nollywood' } });

      await admin.getUniverseById('u1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes/u1');
    });
  });

  describe('getUniverseByName', () => {
    it('should fetch universe by name', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: 'u1', name: 'nollywood' } });

      await admin.getUniverseByName('nollywood');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes/name/nollywood');
    });
  });

  describe('createUniverse', () => {
    it('should create a new universe', async () => {
      const universe = {
        name: 'afrobeats',
        displayName: 'Afrobeats',
        description: 'Music universe',
      };
      client.request.mockResolvedValue({ success: true, data: { id: 'u2', ...universe } });

      await admin.createUniverse(universe);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes', {
        method: 'POST',
        body: JSON.stringify(universe),
      });
    });
  });

  describe('updateUniverse', () => {
    it('should update an existing universe', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { id: 'u1', displayName: 'Updated' },
      });

      await admin.updateUniverse('u1', { displayName: 'Updated' });

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes/u1', {
        method: 'PUT',
        body: JSON.stringify({ displayName: 'Updated' }),
      });
    });
  });

  describe('deleteUniverse', () => {
    it('should delete a universe', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Deleted' } });

      await admin.deleteUniverse('u1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes/u1', {
        method: 'DELETE',
      });
    });
  });

  describe('toggleUniverse', () => {
    it('should toggle universe enabled state', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: 'u1', isEnabled: false } });

      await admin.toggleUniverse('u1', false);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes/u1/toggle', {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: false }),
      });
    });
  });

  // ── Feature Flags ─────────────────────────────────────────────────────
  describe('updateFeatureFlag', () => {
    it('should update a feature flag', async () => {
      const flag = { featureKey: 'live_streaming', isEnabled: true };
      client.request.mockResolvedValue({ success: true, data: { universeId: 'u1', ...flag } });

      await admin.updateFeatureFlag('u1', flag);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/universes/u1/feature-flags', {
        method: 'PUT',
        body: JSON.stringify(flag),
      });
    });
  });

  describe('deleteFeatureFlag', () => {
    it('should delete a feature flag', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Deleted' } });

      await admin.deleteFeatureFlag('u1', 'live_streaming');

      expect(client.request).toHaveBeenCalledWith(
        '/api/v1/admin/universes/u1/feature-flags/live_streaming',
        {
          method: 'DELETE',
        }
      );
    });
  });

  describe('checkFeatureFlag', () => {
    it('should check if a feature flag is enabled', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { universeName: 'nollywood', featureKey: 'live_streaming', isEnabled: true },
      });

      const result = await admin.checkFeatureFlag('nollywood', 'live_streaming');

      expect(client.request).toHaveBeenCalledWith(
        '/api/v1/admin/universes/check/nollywood/live_streaming'
      );
      expect(result.data!.isEnabled).toBe(true);
    });
  });

  // ── System Settings ───────────────────────────────────────────────────
  describe('getAllSettings', () => {
    it('should fetch all system settings', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: [{ key: 'max_upload_size', value: 100 }],
      });

      await admin.getAllSettings();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings');
    });
  });

  describe('getPublicSettings', () => {
    it('should fetch public settings', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getPublicSettings();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/public');
    });
  });

  describe('getSettingsMap', () => {
    it('should fetch settings as key-value map', async () => {
      client.request.mockResolvedValue({ success: true, data: { max_upload_size: 100 } });

      await admin.getSettingsMap();

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/map');
    });
  });

  describe('getSettingsByCategory', () => {
    it('should fetch settings by category', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await admin.getSettingsByCategory('security');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/category/security');
    });
  });

  describe('getSettingByKey', () => {
    it('should fetch a single setting by key', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { key: 'max_upload_size', value: 100 },
      });

      await admin.getSettingByKey('max_upload_size');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/max_upload_size');
    });
  });

  describe('getSettingValue', () => {
    it('should fetch a setting value', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { key: 'max_upload_size', value: 100 },
      });

      await admin.getSettingValue('max_upload_size');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/value/max_upload_size');
    });
  });

  describe('createSetting', () => {
    it('should create a new setting', async () => {
      const setting = { key: 'new_key', value: 'new_value', category: 'general' };
      client.request.mockResolvedValue({ success: true, data: { id: 's1', ...setting } });

      await admin.createSetting(setting);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings', {
        method: 'POST',
        body: JSON.stringify(setting),
      });
    });
  });

  describe('updateSetting', () => {
    it('should update an existing setting', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { key: 'max_upload_size', value: 200 },
      });

      await admin.updateSetting('max_upload_size', { value: 200 });

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/max_upload_size', {
        method: 'PUT',
        body: JSON.stringify({ value: 200 }),
      });
    });
  });

  describe('deleteSetting', () => {
    it('should delete a setting', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Deleted' } });

      await admin.deleteSetting('old_key');

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/old_key', {
        method: 'DELETE',
      });
    });
  });

  describe('bulkCreateSettings', () => {
    it('should bulk create settings', async () => {
      const settings = [
        { key: 'a', value: 1 },
        { key: 'b', value: 2 },
      ];
      client.request.mockResolvedValue({ success: true, data: settings });

      await admin.bulkCreateSettings(settings);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/bulk', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    });
  });

  describe('bulkUpdateSettings', () => {
    it('should bulk update settings', async () => {
      const settings = [
        { key: 'a', value: 10 },
        { key: 'b', value: 20 },
      ];
      client.request.mockResolvedValue({ success: true, data: settings });

      await admin.bulkUpdateSettings(settings);

      expect(client.request).toHaveBeenCalledWith('/api/v1/admin/settings/bulk', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    });
  });

  // ── Error Scenarios ───────────────────────────────────────────────────
  describe('Error Handling', () => {
    it('should propagate API errors for admin endpoints', async () => {
      client.request.mockResolvedValue({ success: false, message: 'Forbidden', statusCode: 403 });

      const result = await admin.getDashboard();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Forbidden');
    });

    it('should handle network errors gracefully', async () => {
      client.request.mockResolvedValue({
        success: false,
        message: 'Network error. Please check your connection.',
      });

      const result = await admin.getUsers();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });
});
