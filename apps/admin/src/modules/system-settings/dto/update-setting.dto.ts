import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiPropertyOptional({ description: 'Setting value (can be any JSON-serializable value)' })
  @IsOptional()
  @IsObject()
  value?: any;

  @ApiPropertyOptional({ description: 'Category for grouping settings' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Description of the setting' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the setting is publicly accessible' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateBrandingDto {
  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Favicon URL' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Dark logo URL' })
  @IsOptional()
  @IsString()
  logoDarkUrl?: string;

  @ApiPropertyOptional({ description: 'Primary brand color (hex)' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color (hex)' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Accent brand color (hex)' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional({ description: 'Background color (hex)' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Text color (hex)' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ description: 'Primary font family' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ description: 'Heading font family' })
  @IsOptional()
  @IsString()
  headingFontFamily?: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ description: 'Brand tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ description: 'Plan name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Plan slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Price' })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Billing interval' })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiPropertyOptional({ description: 'Trial period in days' })
  @IsOptional()
  trialDays?: number;

  @ApiPropertyOptional({ description: 'Plan features' })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional({ description: 'Plan limits' })
  @IsOptional()
  @IsObject()
  limits?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether plan is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order' })
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Stripe price ID' })
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @ApiPropertyOptional({ description: 'Paystack plan code' })
  @IsOptional()
  @IsString()
  paystackPlanCode?: string;
}

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ description: 'Site title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Site tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Site description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Business address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({ description: 'SEO meta defaults' })
  @IsOptional()
  @IsObject()
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    keywords?: string[];
  };

  @ApiPropertyOptional({ description: 'Legal pages URLs' })
  @IsOptional()
  @IsObject()
  legalPages?: {
    termsOfService?: string;
    privacyPolicy?: string;
    cookiePolicy?: string;
  };
}

export class UpdateRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  role!: string;

  @ApiProperty({ description: 'Role permissions' })
  @IsObject()
  permissions!: Record<string, string[]>;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether role is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePerformanceDto {
  @ApiPropertyOptional({ description: 'Cache TTL in seconds' })
  @IsOptional()
  cacheTtl?: number;

  @ApiPropertyOptional({ description: 'Enable CDN' })
  @IsOptional()
  @IsBoolean()
  cdnEnabled?: boolean;

  @ApiPropertyOptional({ description: 'CDN domain' })
  @IsOptional()
  @IsString()
  cdnDomain?: string;

  @ApiPropertyOptional({ description: 'Enable gzip compression' })
  @IsOptional()
  @IsBoolean()
  compressionEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Compression level (1-9)' })
  @IsOptional()
  compressionLevel?: number;

  @ApiPropertyOptional({ description: 'Enable image optimization' })
  @IsOptional()
  @IsBoolean()
  imageOptimization?: boolean;

  @ApiPropertyOptional({ description: 'Max upload size in MB' })
  @IsOptional()
  maxUploadSizeMb?: number;

  @ApiPropertyOptional({ description: 'Rate limit per minute' })
  @IsOptional()
  rateLimitPerMinute?: number;
}

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Email provider config' })
  @IsOptional()
  @IsObject()
  emailProvider?: {
    type: string;
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
  };

  @ApiPropertyOptional({ description: 'Push provider config' })
  @IsOptional()
  @IsObject()
  pushProvider?: {
    type: string;
    projectId?: string;
    serviceAccountKey?: string;
  };

  @ApiPropertyOptional({ description: 'SMS provider config' })
  @IsOptional()
  @IsObject()
  smsProvider?: {
    type: string;
    apiKey?: string;
    fromNumber?: string;
  };

  @ApiPropertyOptional({ description: 'Notification events config' })
  @IsOptional()
  @IsObject()
  events?: Record<string, { email?: boolean; push?: boolean; sms?: boolean }>;
}

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Template body' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Template locale' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Whether template is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  @IsArray()
  variables?: string[];

  @ApiPropertyOptional({ description: 'Plain text version' })
  @IsOptional()
  @IsString()
  plainText?: string;
}

export class UpdateIntegrationDto {
  @ApiProperty({ description: 'Whether integration is enabled' })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ description: 'API credentials' })
  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Webhook secret' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ description: 'Additional config' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdateComplianceDto {
  @ApiPropertyOptional({ description: 'Enable GDPR compliance' })
  @IsOptional()
  @IsBoolean()
  gdprEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable CCPA compliance' })
  @IsOptional()
  @IsBoolean()
  ccpaEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Terms of service content' })
  @IsOptional()
  @IsString()
  termsOfService?: string;

  @ApiPropertyOptional({ description: 'Privacy policy content' })
  @IsOptional()
  @IsString()
  privacyPolicy?: string;

  @ApiPropertyOptional({ description: 'Cookie policy content' })
  @IsOptional()
  @IsString()
  cookiePolicy?: string;

  @ApiPropertyOptional({ description: 'Require cookie consent' })
  @IsOptional()
  @IsBoolean()
  requireCookieConsent?: boolean;

  @ApiPropertyOptional({ description: 'Enable data export requests' })
  @IsOptional()
  @IsBoolean()
  allowDataExport?: boolean;

  @ApiPropertyOptional({ description: 'Enable account deletion requests' })
  @IsOptional()
  @IsBoolean()
  allowAccountDeletion?: boolean;

  @ApiPropertyOptional({ description: 'Data processing agreement URL' })
  @IsOptional()
  @IsString()
  dpaUrl?: string;

  @ApiPropertyOptional({ description: 'Consent banner config' })
  @IsOptional()
  @IsObject()
  consentBanner?: {
    enabled: boolean;
    position: string;
    colors?: Record<string, string>;
  };
}

export class UpdateDataRetentionDto {
  @ApiPropertyOptional({ description: 'User data retention days (0=forever)' })
  @IsOptional()
  userDataDays?: number;

  @ApiPropertyOptional({ description: 'Inactive account deletion days' })
  @IsOptional()
  inactiveAccountDays?: number;

  @ApiPropertyOptional({ description: 'Analytics data retention days' })
  @IsOptional()
  analyticsDays?: number;

  @ApiPropertyOptional({ description: 'Audit log retention days' })
  @IsOptional()
  auditLogDays?: number;

  @ApiPropertyOptional({ description: 'Media file retention days' })
  @IsOptional()
  mediaDays?: number;

  @ApiPropertyOptional({ description: 'Automated cleanup enabled' })
  @IsOptional()
  @IsBoolean()
  autoCleanupEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Cleanup schedule (cron)' })
  @IsOptional()
  @IsString()
  cleanupSchedule?: string;
}

export class UpdateLocalizationDto {
  @ApiPropertyOptional({ description: 'Default locale' })
  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @ApiPropertyOptional({ description: 'Supported locales' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLocales?: string[];

  @ApiPropertyOptional({ description: 'Default timezone' })
  @IsOptional()
  @IsString()
  defaultTimezone?: string;

  @ApiPropertyOptional({ description: 'Default currency' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Supported currencies' })
  @IsOptional()
  @IsArray()
  supportedCurrencies?: string[];

  @ApiPropertyOptional({ description: 'Date format' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ description: 'Time format' })
  @IsOptional()
  @IsString()
  timeFormat?: string;

  @ApiPropertyOptional({ description: 'RTL support enabled' })
  @IsOptional()
  @IsBoolean()
  rtlEnabled?: boolean;
}

export class UpdateSecurityDto {
  @ApiPropertyOptional({ description: 'Require 2FA for admins' })
  @IsOptional()
  @IsBoolean()
  require2faAdmins?: boolean;

  @ApiPropertyOptional({ description: 'Require 2FA for all users' })
  @IsOptional()
  @IsBoolean()
  require2faAll?: boolean;

  @ApiPropertyOptional({ description: 'Password policy' })
  @IsOptional()
  @IsObject()
  passwordPolicy?: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
  };

  @ApiPropertyOptional({ description: 'Session timeout in minutes' })
  @IsOptional()
  sessionTimeoutMinutes?: number;

  @ApiPropertyOptional({ description: 'Max login attempts before lockout' })
  @IsOptional()
  maxLoginAttempts?: number;

  @ApiPropertyOptional({ description: 'Lockout duration in minutes' })
  @IsOptional()
  lockoutDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'JWT secret (for token rotation)' })
  @IsOptional()
  @IsString()
  jwtSecret?: string;

  @ApiPropertyOptional({ description: 'JWT expiration in seconds' })
  @IsOptional()
  jwtExpirationSeconds?: number;

  @ApiPropertyOptional({ description: 'Enable CORS' })
  @IsOptional()
  @IsBoolean()
  corsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Allowed CORS origins' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  corsOrigins?: string[];

  @ApiPropertyOptional({ description: 'Enable CSP headers' })
  @IsOptional()
  @IsBoolean()
  cspEnabled?: boolean;
}

export class UpdateIpRulesDto {
  @ApiPropertyOptional({ description: 'Whitelisted IPs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whitelist?: string[];

  @ApiPropertyOptional({ description: 'Blacklisted IPs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blacklist?: string[];

  @ApiPropertyOptional({ description: 'IP rules mode' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ description: 'Rate limit per IP per minute' })
  @IsOptional()
  rateLimitPerIp?: number;

  @ApiPropertyOptional({ description: 'Block VPN/proxy connections' })
  @IsOptional()
  @IsBoolean()
  blockVpn?: boolean;
}
