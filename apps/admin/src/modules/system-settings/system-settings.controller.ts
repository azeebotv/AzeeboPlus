import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Prisma } from '../../generated/prisma';
import { SystemSettingsService } from './system-settings.service';
import { AuditLogService } from '../audit/audit.service';
import {
  CreateSettingDto,
  BulkCreateSettingsDto,
  ImportSettingsDto,
  SaveDraftDto,
  SubscriptionPlanDto,
  AdminUserDto,
  EmailTemplateDto,
  IntegrationSettingsDto,
} from './dto/create-setting.dto';
import {
  UpdateSettingDto,
  UpdateBrandingDto,
  UpdateSubscriptionPlanDto,
  UpdateSiteSettingsDto,
  UpdateRoleDto,
  UpdatePerformanceDto,
  UpdateNotificationSettingsDto,
  UpdateEmailTemplateDto,
  UpdateIntegrationDto,
  UpdateComplianceDto,
  UpdateDataRetentionDto,
  UpdateLocalizationDto,
  UpdateSecurityDto,
  UpdateIpRulesDto,
} from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('System Settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemSettingsController {
  private readonly logger = new Logger(SystemSettingsController.name);

  constructor(
    private readonly systemSettingsService: SystemSettingsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getActorId(req: { user?: { sub: string; id?: string } }): string | undefined {
    return req.user?.id || req.user?.sub;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERAL
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  async getAllSettings() {
    return this.systemSettingsService.getAllSettings();
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public settings' })
  async getPublicSettings() {
    return this.systemSettingsService.getPublicSettings();
  }

  @Get('map')
  @ApiOperation({ summary: 'Get settings as key-value map' })
  async getSettingsMap() {
    return this.systemSettingsService.getSettingsMap();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get settings by category' })
  async getSettingsByCategory(@Param('category') category: string) {
    return this.systemSettingsService.getSettingsByCategory(category);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export all settings as JSON' })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  async exportSettings(@Query('categories') categories?: string[]) {
    return this.systemSettingsService.exportSettings(categories);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import settings from JSON' })
  async importSettings(@Body() data: ImportSettingsDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Importing settings');
    const result = await this.systemSettingsService.importSettings(data.data, {
      strategy: data.strategy,
      categories: data.categories,
      actorId: this.getActorId(req),
    });
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.imported',
      targetType: 'settings',
      details: { strategy: data.strategy, categories: data.categories },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create/update settings' })
  async bulkSettings(@Body() body: { settings: CreateSettingDto[] } | CreateSettingDto[], @Req() req: { user?: { sub: string; id?: string } }) {
    const settings = Array.isArray(body) ? body : body.settings;
    this.logger.log(`Bulk processing ${settings.length} settings`);
    const result = await this.systemSettingsService.bulkCreateSettings(settings);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.bulk_created',
      targetType: 'settings',
      details: { count: settings.length },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('save-draft')
  @ApiOperation({ summary: 'Auto-save a draft setting' })
  async saveDraft(@Body() data: SaveDraftDto, @Req() req: { user?: { sub: string; id?: string } }) {
    const result = await this.systemSettingsService.saveDraft(data.key, data.value, data.category);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.draft_saved',
      targetType: 'setting',
      targetId: data.key,
      details: { category: data.category },
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('draft/:key')
  @ApiOperation({ summary: 'Get a draft setting' })
  async getDraft(@Param('key') key: string) {
    return this.systemSettingsService.getDraft(key);
  }

  @Delete('draft/:key')
  @ApiOperation({ summary: 'Delete a draft setting' })
  async deleteDraft(@Param('key') key: string, @Req() req: { user?: { sub: string; id?: string } }) {
    const result = await this.systemSettingsService.deleteDraft(key);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.draft_deleted',
      targetType: 'setting',
      targetId: key,
      ipAddress: req.ip,
    });
    return result;
  }

  @Get(':key/history')
  @ApiOperation({ summary: 'Get setting version history' })
  async getSettingHistory(@Param('key') key: string) {
    return this.systemSettingsService.getSettingHistory(key);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key' })
  async getSettingByKey(@Param('key') key: string) {
    return this.systemSettingsService.getSettingByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Create a setting' })
  async createSetting(@Body() data: CreateSettingDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Creating setting: ${data.key}`);
    const result = await this.systemSettingsService.createSetting(data);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'setting.created',
      targetType: 'setting',
      targetId: data.key,
      details: { category: data.category },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a setting' })
  async updateSetting(@Param('key') key: string, @Body() data: UpdateSettingDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Updating setting: ${key}`);
    const result = await this.systemSettingsService.updateSetting(key, data, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'setting.updated',
      targetType: 'setting',
      targetId: key,
      details: data as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a setting' })
  async deleteSetting(@Param('key') key: string, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Deleting setting: ${key}`);
    const result = await this.systemSettingsService.deleteSetting(key, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'setting.deleted',
      targetType: 'setting',
      targetId: key,
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BRANDING
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('branding')
  @ApiOperation({ summary: 'Get all branding settings' })
  async getBranding() {
    return this.systemSettingsService.getBrandingSettings();
  }

  @Put('branding')
  @ApiOperation({ summary: 'Update branding settings' })
  async updateBranding(@Body() data: UpdateBrandingDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating branding settings');
    const result = await this.systemSettingsService.updateBrandingSettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.branding.updated',
      targetType: 'settings',
      targetId: 'branding',
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION PLANS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('subscriptions/plans')
  @ApiOperation({ summary: 'List subscription plans' })
  async listSubscriptionPlans() {
    return this.systemSettingsService.getSubscriptionPlans();
  }

  @Post('subscriptions/plans')
  @ApiOperation({ summary: 'Create subscription plan' })
  async createSubscriptionPlan(@Body() data: SubscriptionPlanDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Creating subscription plan: ${data.name}`);
    const result = await this.systemSettingsService.createSubscriptionPlan(data);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'subscription_plan.created',
      targetType: 'subscription_plan',
      targetId: data.name,
      ipAddress: req.ip,
    });
    return result;
  }

  @Put('subscriptions/plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() data: UpdateSubscriptionPlanDto,
    @Req() req: { user?: { sub: string; id?: string } },
  ) {
    this.logger.log(`Updating subscription plan: ${id}`);
    const result = await this.systemSettingsService.updateSubscriptionPlan(id, data, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'subscription_plan.updated',
      targetType: 'subscription_plan',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete('subscriptions/plans/:id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  async deleteSubscriptionPlan(@Param('id') id: string, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Deleting subscription plan: ${id}`);
    const result = await this.systemSettingsService.deleteSubscriptionPlan(id, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'subscription_plan.deleted',
      targetType: 'subscription_plan',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SITE IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('site')
  @ApiOperation({ summary: 'Get site settings' })
  async getSiteSettings() {
    return this.systemSettingsService.getSiteSettings();
  }

  @Put('site')
  @ApiOperation({ summary: 'Update site settings' })
  async updateSiteSettings(@Body() data: UpdateSiteSettingsDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating site settings');
    const result = await this.systemSettingsService.updateSiteSettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.site.updated',
      targetType: 'settings',
      targetId: 'site',
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // USER ACCESS / RBAC
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('access/roles')
  @ApiOperation({ summary: 'List RBAC roles' })
  async listRoles() {
    return this.systemSettingsService.getRoles();
  }

  @Put('access/roles/:role')
  @ApiOperation({ summary: 'Update role permissions' })
  async updateRole(@Param('role') role: string, @Body() data: UpdateRoleDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Updating role: ${role}`);
    const result = await this.systemSettingsService.updateRole(role, data as unknown as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.role.updated',
      targetType: 'role',
      targetId: role,
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('access/admins')
  @ApiOperation({ summary: 'List admin users' })
  async listAdmins() {
    return this.systemSettingsService.getAdminUsers();
  }

  @Post('access/admins')
  @ApiOperation({ summary: 'Create admin user' })
  async createAdmin(@Body() data: AdminUserDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Creating admin user: ${data.email}`);
    const result = await this.systemSettingsService.createAdminUser(data);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.admin.created',
      targetType: 'admin_user',
      targetId: data.email,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete('access/admins/:id')
  @ApiOperation({ summary: 'Remove admin user' })
  async removeAdmin(@Param('id') id: string, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Removing admin user: ${id}`);
    const result = await this.systemSettingsService.removeAdminUser(id, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.admin.removed',
      targetType: 'admin_user',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('performance')
  @ApiOperation({ summary: 'Get performance settings' })
  async getPerformance() {
    return this.systemSettingsService.getPerformanceSettings();
  }

  @Put('performance')
  @ApiOperation({ summary: 'Update performance settings' })
  async updatePerformance(@Body() data: UpdatePerformanceDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating performance settings');
    const result = await this.systemSettingsService.updatePerformanceSettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.performance.updated',
      targetType: 'settings',
      targetId: 'performance',
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification settings' })
  async getNotifications() {
    return this.systemSettingsService.getNotificationSettings();
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification settings' })
  async updateNotifications(@Body() data: UpdateNotificationSettingsDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating notification settings');
    const result = await this.systemSettingsService.updateNotificationSettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.notifications.updated',
      targetType: 'settings',
      targetId: 'notifications',
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('notifications/templates')
  @ApiOperation({ summary: 'List email templates' })
  async listEmailTemplates() {
    return this.systemSettingsService.getEmailTemplates();
  }

  @Post('notifications/templates')
  @ApiOperation({ summary: 'Create email template' })
  async createEmailTemplate(@Body() data: EmailTemplateDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Creating email template: ${data.name}`);
    const result = await this.systemSettingsService.createEmailTemplate(data);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.email_template.created',
      targetType: 'email_template',
      targetId: data.name,
      ipAddress: req.ip,
    });
    return result;
  }

  @Put('notifications/templates/:id')
  @ApiOperation({ summary: 'Update email template' })
  async updateEmailTemplate(
    @Param('id') id: string,
    @Body() data: UpdateEmailTemplateDto,
    @Req() req: { user?: { sub: string; id?: string } },
  ) {
    this.logger.log(`Updating email template: ${id}`);
    const result = await this.systemSettingsService.updateEmailTemplate(id, data, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.email_template.updated',
      targetType: 'email_template',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete('notifications/templates/:id')
  @ApiOperation({ summary: 'Delete email template' })
  async deleteEmailTemplate(@Param('id') id: string, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Deleting email template: ${id}`);
    const result = await this.systemSettingsService.deleteEmailTemplate(id, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.email_template.deleted',
      targetType: 'email_template',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('integrations')
  @ApiOperation({ summary: 'List integrations' })
  async listIntegrations() {
    return this.systemSettingsService.getIntegrations();
  }

  @Put('integrations/:provider')
  @ApiOperation({ summary: 'Update integration config' })
  async updateIntegration(
    @Param('provider') provider: string,
    @Body() data: UpdateIntegrationDto,
    @Req() req: { user?: { sub: string; id?: string } },
  ) {
    this.logger.log(`Updating integration: ${provider}`);
    const result = await this.systemSettingsService.updateIntegration(provider, data as unknown as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.integration.updated',
      targetType: 'integration',
      targetId: provider,
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('integrations/:provider/test')
  @ApiOperation({ summary: 'Test integration connection' })
  async testIntegration(@Param('provider') provider: string, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log(`Testing integration: ${provider}`);
    const result = await this.systemSettingsService.testIntegration(provider);
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.integration.tested',
      targetType: 'integration',
      targetId: provider,
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('compliance')
  @ApiOperation({ summary: 'Get compliance settings' })
  async getCompliance() {
    return this.systemSettingsService.getComplianceSettings();
  }

  @Put('compliance')
  @ApiOperation({ summary: 'Update compliance settings' })
  async updateCompliance(@Body() data: UpdateComplianceDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating compliance settings');
    const result = await this.systemSettingsService.updateComplianceSettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.compliance.updated',
      targetType: 'settings',
      targetId: 'compliance',
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('compliance/data-retention')
  @ApiOperation({ summary: 'Get data retention policies' })
  async getDataRetention() {
    return this.systemSettingsService.getDataRetentionSettings();
  }

  @Put('compliance/data-retention')
  @ApiOperation({ summary: 'Update data retention policies' })
  async updateDataRetention(@Body() data: UpdateDataRetentionDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating data retention policies');
    const result = await this.systemSettingsService.updateDataRetentionSettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.data_retention.updated',
      targetType: 'settings',
      targetId: 'data-retention',
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOCALIZATION
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('localization')
  @ApiOperation({ summary: 'Get localization settings' })
  async getLocalization() {
    return this.systemSettingsService.getLocalizationSettings();
  }

  @Put('localization')
  @ApiOperation({ summary: 'Update localization settings' })
  async updateLocalization(@Body() data: UpdateLocalizationDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating localization settings');
    const result = await this.systemSettingsService.updateLocalizationSettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.localization.updated',
      targetType: 'settings',
      targetId: 'localization',
      ipAddress: req.ip,
    });
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('security')
  @ApiOperation({ summary: 'Get security settings' })
  async getSecurity() {
    return this.systemSettingsService.getSecuritySettings();
  }

  @Put('security')
  @ApiOperation({ summary: 'Update security settings' })
  async updateSecurity(@Body() data: UpdateSecurityDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating security settings');
    const result = await this.systemSettingsService.updateSecuritySettings(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.security.updated',
      targetType: 'settings',
      targetId: 'security',
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('security/ip-rules')
  @ApiOperation({ summary: 'Get IP whitelist/blacklist' })
  async getIpRules() {
    return this.systemSettingsService.getIpRules();
  }

  @Put('security/ip-rules')
  @ApiOperation({ summary: 'Update IP rules' })
  async updateIpRules(@Body() data: UpdateIpRulesDto, @Req() req: { user?: { sub: string; id?: string } }) {
    this.logger.log('Updating IP rules');
    const result = await this.systemSettingsService.updateIpRules(data as Record<string, Prisma.InputJsonValue>, this.getActorId(req));
    await this.auditLogService.log({
      actorId: this.getActorId(req),
      action: 'settings.ip_rules.updated',
      targetType: 'settings',
      targetId: 'ip-rules',
      ipAddress: req.ip,
    });
    return result;
  }
}
