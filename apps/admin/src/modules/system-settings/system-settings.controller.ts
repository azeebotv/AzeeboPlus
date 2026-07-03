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
import { SystemSettingsService } from './system-settings.service';
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

  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  private getActorId(req: any): string | undefined {
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
  async importSettings(@Body() data: ImportSettingsDto, @Req() req: any) {
    this.logger.log('Importing settings');
    return this.systemSettingsService.importSettings(data.data, {
      strategy: data.strategy,
      categories: data.categories,
      actorId: this.getActorId(req),
    });
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create/update settings' })
  async bulkSettings(@Body() body: { settings: CreateSettingDto[] } | CreateSettingDto[], @Req() req: any) {
    const settings = Array.isArray(body) ? body : body.settings;
    this.logger.log(`Bulk processing ${settings.length} settings`);
    return this.systemSettingsService.bulkCreateSettings(settings);
  }

  @Post('save-draft')
  @ApiOperation({ summary: 'Auto-save a draft setting' })
  async saveDraft(@Body() data: SaveDraftDto) {
    return this.systemSettingsService.saveDraft(data.key, data.value, data.category);
  }

  @Get('draft/:key')
  @ApiOperation({ summary: 'Get a draft setting' })
  async getDraft(@Param('key') key: string) {
    return this.systemSettingsService.getDraft(key);
  }

  @Delete('draft/:key')
  @ApiOperation({ summary: 'Delete a draft setting' })
  async deleteDraft(@Param('key') key: string) {
    return this.systemSettingsService.deleteDraft(key);
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
  async createSetting(@Body() data: CreateSettingDto) {
    this.logger.log(`Creating setting: ${data.key}`);
    return this.systemSettingsService.createSetting(data);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a setting' })
  async updateSetting(@Param('key') key: string, @Body() data: UpdateSettingDto, @Req() req: any) {
    this.logger.log(`Updating setting: ${key}`);
    return this.systemSettingsService.updateSetting(key, data, this.getActorId(req));
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a setting' })
  async deleteSetting(@Param('key') key: string, @Req() req: any) {
    this.logger.log(`Deleting setting: ${key}`);
    return this.systemSettingsService.deleteSetting(key, this.getActorId(req));
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
  async updateBranding(@Body() data: UpdateBrandingDto, @Req() req: any) {
    this.logger.log('Updating branding settings');
    return this.systemSettingsService.updateBrandingSettings(data as Record<string, any>, this.getActorId(req));
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
  async createSubscriptionPlan(@Body() data: SubscriptionPlanDto) {
    this.logger.log(`Creating subscription plan: ${data.name}`);
    return this.systemSettingsService.createSubscriptionPlan(data);
  }

  @Put('subscriptions/plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() data: UpdateSubscriptionPlanDto,
    @Req() req: any,
  ) {
    this.logger.log(`Updating subscription plan: ${id}`);
    return this.systemSettingsService.updateSubscriptionPlan(id, data, this.getActorId(req));
  }

  @Delete('subscriptions/plans/:id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  async deleteSubscriptionPlan(@Param('id') id: string, @Req() req: any) {
    this.logger.log(`Deleting subscription plan: ${id}`);
    return this.systemSettingsService.deleteSubscriptionPlan(id, this.getActorId(req));
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
  async updateSiteSettings(@Body() data: UpdateSiteSettingsDto, @Req() req: any) {
    this.logger.log('Updating site settings');
    return this.systemSettingsService.updateSiteSettings(data as Record<string, any>, this.getActorId(req));
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
  async updateRole(@Param('role') role: string, @Body() data: UpdateRoleDto, @Req() req: any) {
    this.logger.log(`Updating role: ${role}`);
    return this.systemSettingsService.updateRole(role, data as Record<string, any>, this.getActorId(req));
  }

  @Get('access/admins')
  @ApiOperation({ summary: 'List admin users' })
  async listAdmins() {
    return this.systemSettingsService.getAdminUsers();
  }

  @Post('access/admins')
  @ApiOperation({ summary: 'Create admin user' })
  async createAdmin(@Body() data: AdminUserDto) {
    this.logger.log(`Creating admin user: ${data.email}`);
    return this.systemSettingsService.createAdminUser(data);
  }

  @Delete('access/admins/:id')
  @ApiOperation({ summary: 'Remove admin user' })
  async removeAdmin(@Param('id') id: string, @Req() req: any) {
    this.logger.log(`Removing admin user: ${id}`);
    return this.systemSettingsService.removeAdminUser(id, this.getActorId(req));
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
  async updatePerformance(@Body() data: UpdatePerformanceDto, @Req() req: any) {
    this.logger.log('Updating performance settings');
    return this.systemSettingsService.updatePerformanceSettings(data as Record<string, any>, this.getActorId(req));
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
  async updateNotifications(@Body() data: UpdateNotificationSettingsDto, @Req() req: any) {
    this.logger.log('Updating notification settings');
    return this.systemSettingsService.updateNotificationSettings(data as Record<string, any>, this.getActorId(req));
  }

  @Get('notifications/templates')
  @ApiOperation({ summary: 'List email templates' })
  async listEmailTemplates() {
    return this.systemSettingsService.getEmailTemplates();
  }

  @Post('notifications/templates')
  @ApiOperation({ summary: 'Create email template' })
  async createEmailTemplate(@Body() data: EmailTemplateDto) {
    this.logger.log(`Creating email template: ${data.name}`);
    return this.systemSettingsService.createEmailTemplate(data);
  }

  @Put('notifications/templates/:id')
  @ApiOperation({ summary: 'Update email template' })
  async updateEmailTemplate(
    @Param('id') id: string,
    @Body() data: UpdateEmailTemplateDto,
    @Req() req: any,
  ) {
    this.logger.log(`Updating email template: ${id}`);
    return this.systemSettingsService.updateEmailTemplate(id, data, this.getActorId(req));
  }

  @Delete('notifications/templates/:id')
  @ApiOperation({ summary: 'Delete email template' })
  async deleteEmailTemplate(@Param('id') id: string, @Req() req: any) {
    this.logger.log(`Deleting email template: ${id}`);
    return this.systemSettingsService.deleteEmailTemplate(id, this.getActorId(req));
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
    @Req() req: any,
  ) {
    this.logger.log(`Updating integration: ${provider}`);
    return this.systemSettingsService.updateIntegration(provider, data as Record<string, any>, this.getActorId(req));
  }

  @Post('integrations/:provider/test')
  @ApiOperation({ summary: 'Test integration connection' })
  async testIntegration(@Param('provider') provider: string) {
    this.logger.log(`Testing integration: ${provider}`);
    return this.systemSettingsService.testIntegration(provider);
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
  async updateCompliance(@Body() data: UpdateComplianceDto, @Req() req: any) {
    this.logger.log('Updating compliance settings');
    return this.systemSettingsService.updateComplianceSettings(data as Record<string, any>, this.getActorId(req));
  }

  @Get('compliance/data-retention')
  @ApiOperation({ summary: 'Get data retention policies' })
  async getDataRetention() {
    return this.systemSettingsService.getDataRetentionSettings();
  }

  @Put('compliance/data-retention')
  @ApiOperation({ summary: 'Update data retention policies' })
  async updateDataRetention(@Body() data: UpdateDataRetentionDto, @Req() req: any) {
    this.logger.log('Updating data retention policies');
    return this.systemSettingsService.updateDataRetentionSettings(data as Record<string, any>, this.getActorId(req));
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
  async updateLocalization(@Body() data: UpdateLocalizationDto, @Req() req: any) {
    this.logger.log('Updating localization settings');
    return this.systemSettingsService.updateLocalizationSettings(data as Record<string, any>, this.getActorId(req));
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
  async updateSecurity(@Body() data: UpdateSecurityDto, @Req() req: any) {
    this.logger.log('Updating security settings');
    return this.systemSettingsService.updateSecuritySettings(data as Record<string, any>, this.getActorId(req));
  }

  @Get('security/ip-rules')
  @ApiOperation({ summary: 'Get IP whitelist/blacklist' })
  async getIpRules() {
    return this.systemSettingsService.getIpRules();
  }

  @Put('security/ip-rules')
  @ApiOperation({ summary: 'Update IP rules' })
  async updateIpRules(@Body() data: UpdateIpRulesDto, @Req() req: any) {
    this.logger.log('Updating IP rules');
    return this.systemSettingsService.updateIpRules(data as Record<string, any>, this.getActorId(req));
  }
}
