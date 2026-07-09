import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../database/prisma.service';
import { CreateSettingDto, SubscriptionPlanDto, EmailTemplateDto, IntegrationSettingsDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

export interface SettingsVersion {
  previousValue: Prisma.JsonValue;
  newValue: Prisma.JsonValue;
  changedBy?: string;
  changedAt: Date;
}

export interface AuditEntry {
  action: string;
  key: string;
  previousValue?: Prisma.JsonValue;
  newValue?: Prisma.JsonValue;
  actorId?: string;
  timestamp: Date;
}

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── General CRUD ──────────────────────────────────────────────────────────────

  async getAllSettings() {
    try {
      return await this.prisma.systemSettings.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });
    } catch (error) {
      this.logger.error('Failed to fetch settings', error);
      throw error;
    }
  }

  async getPublicSettings() {
    try {
      return await this.prisma.systemSettings.findMany({
        where: { isPublic: true },
        orderBy: { key: 'asc' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch public settings', error);
      throw error;
    }
  }

  async getSettingsMap(): Promise<Record<string, Prisma.JsonValue>> {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        where: { isPublic: true },
      });
      const map: Record<string, Prisma.JsonValue> = {};
      settings.forEach((s) => {
        map[s.key] = s.value;
      });
      return map;
    } catch (error) {
      this.logger.error('Failed to fetch settings map', error);
      throw error;
    }
  }

  async getSettingsByCategory(category: string) {
    try {
      return await this.prisma.systemSettings.findMany({
        where: { category },
        orderBy: { key: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch settings for category ${category}`, error);
      throw error;
    }
  }

  async getSettingByKey(key: string) {
    try {
      const setting = await this.prisma.systemSettings.findUnique({ where: { key } });
      if (!setting) {
        throw new NotFoundException(`Setting with key "${key}" not found`);
      }
      return setting;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch setting ${key}`, error);
      throw error;
    }
  }

  async getSettingValue<T = unknown>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.prisma.systemSettings.findUnique({ where: { key } });
      if (!setting) {
        if (defaultValue !== undefined) return defaultValue;
        throw new NotFoundException(`Setting with key "${key}" not found`);
      }
      return setting.value as T;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch setting value ${key}`, error);
      if (defaultValue !== undefined) return defaultValue;
      throw error;
    }
  }

  async createSetting(data: CreateSettingDto) {
    try {
      const existing = await this.prisma.systemSettings.findUnique({ where: { key: data.key } });
      if (existing) {
        throw new BadRequestException(`Setting with key "${data.key}" already exists`);
      }
      const setting = await this.prisma.systemSettings.create({
        data: {
          key: data.key,
          value: data.value,
          category: data.category || 'general',
          description: data.description,
          isPublic: data.isPublic ?? false,
        },
      });
      this.logger.log(`Created setting: ${setting.key}`);
      return setting;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create setting', error);
      throw error;
    }
  }

  async updateSetting(key: string, data: UpdateSettingDto, actorId?: string) {
    try {
      const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
      if (!existing) {
        throw new NotFoundException(`Setting with key "${key}" not found`);
      }

      const previousValue = existing.value;
      const setting = await this.prisma.systemSettings.update({
        where: { key },
        data: {
          ...(data.value !== undefined && { value: data.value }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        },
      });

      await this.logAudit('update', key, previousValue, setting.value, actorId);
      this.logger.log(`Updated setting: ${setting.key}`);
      return setting;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update setting ${key}`, error);
      throw error;
    }
  }

  async deleteSetting(key: string, actorId?: string) {
    try {
      const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
      if (!existing) {
        throw new NotFoundException(`Setting with key "${key}" not found`);
      }

      await this.logAudit('delete', key, existing.value, null, actorId);
      await this.prisma.systemSettings.delete({ where: { key } });
      this.logger.log(`Deleted setting: ${key}`);
      return { message: 'Setting deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete setting ${key}`, error);
      throw error;
    }
  }

  // ─── Bulk Operations ───────────────────────────────────────────────────────────

  async bulkCreateSettings(settings: CreateSettingDto[]) {
    const results = [];
    for (const setting of settings) {
      try {
        const created = await this.createSetting(setting);
        results.push({ key: setting.key, success: true, data: created });
      } catch (error) {
        results.push({
          key: setting.key,
          success: false,
          error: error instanceof Error ? (error as Error).message : 'Unknown error',
        });
      }
    }
    return results;
  }

  async bulkUpdateSettings(settings: { key: string; value: Prisma.InputJsonValue }[], actorId?: string) {
    const results = [];
    for (const setting of settings) {
      try {
        const updated = await this.updateSetting(setting.key, { value: setting.value }, actorId);
        results.push({ key: setting.key, success: true, data: updated });
      } catch (error) {
        results.push({
          key: setting.key,
          success: false,
          error: error instanceof Error ? (error as Error).message : 'Unknown error',
        });
      }
    }
    return results;
  }

  // ─── Import / Export ───────────────────────────────────────────────────────────

  async exportSettings(categories?: string[]) {
    try {
      const where = categories?.length ? { category: { in: categories } } : {};
      const settings = await this.prisma.systemSettings.findMany({
        where,
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      const SENSITIVE_PATTERNS = /secret|password|token|key/i;

      const exported: Record<string, Record<string, { value: Prisma.JsonValue; description: string | null; isPublic: boolean }>> = {};
      for (const s of settings) {
        if (SENSITIVE_PATTERNS.test(s.key)) continue;
        if (!exported[s.category]) exported[s.category] = {};
        exported[s.category][s.key] = {
          value: s.value,
          description: s.description,
          isPublic: s.isPublic,
        };
      }

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: settings.length,
        data: exported,
      };
    } catch (error) {
      this.logger.error('Failed to export settings', error);
      throw error;
    }
  }

  async importSettings(
    data: Record<string, Record<string, { value?: Prisma.InputJsonValue; description?: string; isPublic?: boolean }>>,
    options?: { strategy?: string; categories?: string[]; actorId?: string },
  ) {
    const strategy = options?.strategy || 'merge';
    const results = [];

    try {
      for (const [category, categorySettings] of Object.entries(data)) {
        if (options?.categories?.length && !options.categories.includes(category)) {
          continue;
        }

        for (const [key, rawSetting] of Object.entries(categorySettings)) {
          try {
            const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
            const fullKey = `${category}.${key}`;
            const settingData = rawSetting as { value?: Prisma.InputJsonValue; description?: string; isPublic?: boolean };
            const value = settingData.value ?? settingData;

            if (existing) {
              if (strategy === 'replace') {
                const updated = await this.updateSetting(
                  key,
                  {
                    value,
                    category,
                    description: settingData.description,
                    isPublic: settingData.isPublic,
                  },
                  options?.actorId,
                );
                results.push({ key: fullKey, action: 'updated', success: true, data: updated });
              } else {
                const merged = this.deepMerge(
                  existing.value as Record<string, Prisma.InputJsonValue>,
                  value as Record<string, Prisma.InputJsonValue>,
                );
                const updated = await this.updateSetting(key, { value: merged }, options?.actorId);
                results.push({ key: fullKey, action: 'merged', success: true, data: updated });
              }
            } else {
              const created = await this.createSetting({
                key,
                value,
                category,
                description: settingData.description,
                isPublic: settingData.isPublic ?? false,
              });
              results.push({ key: fullKey, action: 'created', success: true, data: created });
            }
          } catch (error) {
            results.push({
              key: `${category}.${key}`,
              action: 'error',
              success: false,
              error: error instanceof Error ? (error as Error).message : 'Unknown error',
            });
          }
        }
      }

      return {
        imported: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      this.logger.error('Failed to import settings', error);
      throw error;
    }
  }

  // ─── Drafts ────────────────────────────────────────────────────────────────────

  async saveDraft(key: string, value: Prisma.InputJsonValue, category?: string) {
    const draftKey = `_draft_${key}`;
    try {
      const existing = await this.prisma.systemSettings.findUnique({ where: { key: draftKey } });
      if (existing) {
        return await this.prisma.systemSettings.update({
          where: { key: draftKey },
          data: { value, ...(category && { category }) },
        });
      }
      return await this.prisma.systemSettings.create({
        data: {
          key: draftKey,
          value,
          category: category || 'drafts',
          description: `Auto-save draft for ${key}`,
          isPublic: false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save draft for ${key}`, error);
      throw error;
    }
  }

  async getDraft(key: string) {
    const draftKey = `_draft_${key}`;
    try {
      return await this.prisma.systemSettings.findUnique({ where: { key: draftKey } });
    } catch (error) {
      this.logger.error(`Failed to get draft for ${key}`, error);
      throw error;
    }
  }

  async deleteDraft(key: string) {
    const draftKey = `_draft_${key}`;
    try {
      const existing = await this.prisma.systemSettings.findUnique({ where: { key: draftKey } });
      if (existing) {
        await this.prisma.systemSettings.delete({ where: { key: draftKey } });
      }
      return { message: 'Draft deleted' };
    } catch (error) {
      this.logger.error(`Failed to delete draft for ${key}`, error);
      throw error;
    }
  }

  // ─── Version Tracking ──────────────────────────────────────────────────────────

  async getSettingHistory(key: string): Promise<SettingsVersion[]> {
    try {
      const versions = await this.prisma.systemSettings.findMany({
        where: { key: { startsWith: `_version_${key}_` } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return versions.map((v) => {
        const versionData = v.value as Record<string, Prisma.JsonValue>;
        return {
          previousValue: versionData?.previousValue ?? null,
          newValue: versionData?.newValue ?? null,
          changedBy: typeof versionData?.changedBy === 'string' ? versionData.changedBy : undefined,
          changedAt: v.createdAt,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get history for ${key}`, error);
      throw error;
    }
  }

  // ─── Audit Logging ─────────────────────────────────────────────────────────────

  private async logAudit(
    action: string,
    key: string,
    previousValue: Prisma.JsonValue,
    newValue: Prisma.JsonValue,
    actorId?: string,
  ) {
    try {
      const versionKey = `_version_${key}_${Date.now()}`;
      await this.prisma.systemSettings.create({
        data: {
          key: versionKey,
          value: { previousValue, newValue, changedBy: actorId },
          category: '_versions',
          description: `Version tracking for ${key}`,
          isPublic: false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log audit for ${key}`, error);
    }
  }

  // ─── Branding ──────────────────────────────────────────────────────────────────

  async getBrandingSettings() {
    return this.getSettingsByCategory('branding');
  }

  async updateBrandingSettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `branding.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'branding' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'branding',
            isPublic: true,
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────────────

  async getSubscriptionPlans() {
    return this.getSettingsByCategory('subscriptions');
  }

  async createSubscriptionPlan(data: SubscriptionPlanDto) {
    const key = `subscriptions.plan.${data.slug}`;
    return this.createSetting({
      key,
      value: data as unknown as Prisma.InputJsonValue,
      category: 'subscriptions',
      description: `Subscription plan: ${data.name}`,
      isPublic: true,
    });
  }

  async updateSubscriptionPlan(id: string, data: Partial<SubscriptionPlanDto>, actorId?: string) {
    const key = `subscriptions.plan.${id}`;
    const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException(`Subscription plan "${id}" not found`);
    }
    const merged = { ...(existing.value as Record<string, Prisma.InputJsonValue>), ...data };
    return this.updateSetting(key, { value: merged as Prisma.InputJsonValue }, actorId);
  }

  async deleteSubscriptionPlan(id: string, actorId?: string) {
    const key = `subscriptions.plan.${id}`;
    return this.deleteSetting(key, actorId);
  }

  // ─── Site Identity ─────────────────────────────────────────────────────────────

  async getSiteSettings() {
    return this.getSettingsByCategory('site');
  }

  async updateSiteSettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `site.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'site' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'site',
            isPublic: key === 'title' || key === 'description' || key === 'socialLinks',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  // ─── User Access / RBAC ───────────────────────────────────────────────────────

  async getRoles() {
    return this.getSettingsByCategory('roles');
  }

  async updateRole(role: string, data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const key = `roles.${role}`;
    try {
      const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
      if (existing) {
        return this.updateSetting(key, { value: data, category: 'roles' }, actorId);
      }
      return this.createSetting({
        key,
        value: data,
        category: 'roles',
        description: `RBAC role: ${role}`,
      });
    } catch (error) {
      this.logger.error(`Failed to update role ${role}`, error);
      throw error;
    }
  }

  async getAdminUsers() {
    return this.getSettingsByCategory('admins');
  }

  async createAdminUser(data: { email: string; displayName: string; role: string }) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new BadRequestException('Invalid email format');
    }

    const key = `admins.${data.email}`;
    return this.createSetting({
      key,
      value: data as unknown as Prisma.InputJsonValue,
      category: 'admins',
      description: `Admin user: ${data.displayName}`,
    });
  }

  async removeAdminUser(id: string, actorId?: string) {
    const settings = await this.getSettingsByCategory('admins');
    const admin = settings.find((s) => (s.value as Record<string, Prisma.JsonValue>)?.email === id || s.key === `admins.${id}`);
    if (!admin) {
      throw new NotFoundException(`Admin user "${id}" not found`);
    }
    return this.deleteSetting(admin.key, actorId);
  }

  // ─── Performance ───────────────────────────────────────────────────────────────

  async getPerformanceSettings() {
    return this.getSettingsByCategory('performance');
  }

  async updatePerformanceSettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `performance.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'performance' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'performance',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  // ─── Notifications ─────────────────────────────────────────────────────────────

  async getNotificationSettings() {
    return this.getSettingsByCategory('notifications');
  }

  async updateNotificationSettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `notifications.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'notifications' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'notifications',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  async getEmailTemplates() {
    return this.getSettingsByCategory('email_templates');
  }

  async createEmailTemplate(data: EmailTemplateDto) {
    const key = `email_templates.${data.slug}`;
    return this.createSetting({
      key,
      value: data as unknown as Prisma.InputJsonValue,
      category: 'email_templates',
      description: `Email template: ${data.name}`,
    });
  }

  async updateEmailTemplate(id: string, data: Partial<EmailTemplateDto>, actorId?: string) {
    const key = `email_templates.${id}`;
    const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException(`Email template "${id}" not found`);
    }
    const merged = { ...(existing.value as Record<string, Prisma.InputJsonValue>), ...data };
    return this.updateSetting(key, { value: merged as Prisma.InputJsonValue }, actorId);
  }

  async deleteEmailTemplate(id: string, actorId?: string) {
    const key = `email_templates.${id}`;
    return this.deleteSetting(key, actorId);
  }

  // ─── Integrations ──────────────────────────────────────────────────────────────

  async getIntegrations() {
    return this.getSettingsByCategory('integrations');
  }

  async updateIntegration(provider: string, data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const key = `integrations.${provider}`;
    try {
      const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
      if (existing) {
        const merged = { ...(existing.value as Record<string, Prisma.InputJsonValue>), ...data };
        return this.updateSetting(key, { value: merged as Prisma.InputJsonValue, category: 'integrations' }, actorId);
      }
      return this.createSetting({
        key,
        value: data,
        category: 'integrations',
        description: `Integration: ${provider}`,
      });
    } catch (error) {
      this.logger.error(`Failed to update integration ${provider}`, error);
      throw error;
    }
  }

  async testIntegration(provider: string) {
    const key = `integrations.${provider}`;
    const setting = await this.prisma.systemSettings.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Integration "${provider}" not found`);
    }
    const config = setting.value as Record<string, Prisma.JsonValue>;
    return {
      provider,
      status: config.enabled ? 'connected' : 'disabled',
      testedAt: new Date().toISOString(),
      details: {
        hasCredentials: !!config.credentials,
        hasWebhook: !!config.webhookUrl,
      },
    };
  }

  // ─── Compliance ────────────────────────────────────────────────────────────────

  async getComplianceSettings() {
    return this.getSettingsByCategory('compliance');
  }

  async updateComplianceSettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `compliance.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'compliance' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'compliance',
            isPublic: key === 'termsOfService' || key === 'privacyPolicy' || key === 'cookiePolicy',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  async getDataRetentionSettings() {
    const all = await this.getSettingsByCategory('compliance');
    const retentionKeys = [
      'userDataDays', 'inactiveAccountDays', 'analyticsDays',
      'auditLogDays', 'mediaDays', 'autoCleanupEnabled', 'cleanupSchedule',
    ];
    return all.filter((s) => retentionKeys.some((k) => s.key.endsWith(k)));
  }

  async updateDataRetentionSettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `compliance.retention.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'compliance' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'compliance',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  // ─── Localization ──────────────────────────────────────────────────────────────

  async getLocalizationSettings() {
    return this.getSettingsByCategory('localization');
  }

  async updateLocalizationSettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `localization.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'localization' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'localization',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  // ─── Security ──────────────────────────────────────────────────────────────────

  async getSecuritySettings() {
    return this.getSettingsByCategory('security');
  }

  async updateSecuritySettings(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `security.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'security' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'security',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  async getIpRules() {
    const all = await this.getSettingsByCategory('security');
    const ipKeys = ['whitelist', 'blacklist', 'mode', 'rateLimitPerIp', 'blockVpn'];
    const ipSettings = all.filter((s) => ipKeys.some((k) => s.key.endsWith(k)));
    const result: Record<string, Prisma.JsonValue> = {};
    for (const s of ipSettings) {
      const shortKey = s.key.split('.').pop()!;
      result[shortKey] = s.value;
    }
    return result;
  }

  async updateIpRules(data: Record<string, Prisma.InputJsonValue>, actorId?: string) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `security.ipRules.${key}`;
      try {
        const existing = await this.prisma.systemSettings.findUnique({ where: { key: settingKey } });
        if (existing) {
          const updated = await this.updateSetting(settingKey, { value, category: 'security' }, actorId);
          results.push({ key: settingKey, success: true, data: updated });
        } else {
          const created = await this.createSetting({
            key: settingKey,
            value,
            category: 'security',
          });
          results.push({ key: settingKey, success: true, data: created });
        }
      } catch (error) {
        results.push({ key: settingKey, success: false, error: error instanceof Error ? (error as Error).message : 'Unknown' });
      }
    }
    return results;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────────

  private deepMerge(target: Record<string, Prisma.InputJsonValue>, source: Record<string, Prisma.InputJsonValue>): Record<string, Prisma.InputJsonValue> {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(
          (result[key] as Record<string, Prisma.InputJsonValue>) || {},
          source[key] as Record<string, Prisma.InputJsonValue>,
        );
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
