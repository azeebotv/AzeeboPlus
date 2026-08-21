import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  Header,
  Inject,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '@azeebo/security';
import { AuthThrottlerGuard } from '../../guards/auth-throttler.guard';
import { Request, Response } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { ApiVersioningConfig, API_VERSION_HEADER, DEFAULT_API_VERSION } from '@azeebo/shared-types';
import { createHash, randomUUID } from 'crypto';
import { CircuitBreakerProxyService } from '../../common/circuit-breaker-proxy.service';
import { FeatureFlagService, gatewayFlags } from '@azeebo/feature-flags';

const CACHE_TTL_MS = 300_000; // 5 minutes

interface Endpoint {
  method: string;
  path: string;
  description: string;
}

interface ServiceRouteConfig {
  path: string;
  envKey: string;
  fallbackUrl: string;
  supportedVersions: string[];
  defaultVersion: string;
  endpoints?: Endpoint[];
  // Path building strategy:
  // - 'default': /v{version}/{service}{path} (for auth service)
  // - 'includes-prefix': service already has /v{version}/{service} in global prefix (for user, wallet, recommendation)
  // - 'no-prefix': service has no global prefix (for rewards)
  // - 'auth-service-strategy': auth service has /v{version} as global prefix, and controller at /auth
  pathStrategy?: 'default' | 'includes-prefix' | 'no-prefix' | 'auth-service-strategy';
  pathRewrite?: Record<string, string>;
  // New routes ship behind gateway_new_routes (off by default): the route
  // returns 404 until ops flips the flag. Removed (set false) once the route
  // is fully rolled out.
  isNew?: boolean;
}

interface ServiceRoute {
  path: string;
  targetUrl: string;
  supportedVersions: string[];
  defaultVersion: string;
  endpoints?: Endpoint[];
  pathStrategy?: 'default' | 'includes-prefix' | 'no-prefix' | 'auth-service-strategy';
  pathRewrite?: Record<string, string>;
  isNew?: boolean;
}

export const SERVICE_CONFIGS: ServiceRouteConfig[] = [
  {
    path: '/auth',
    envKey: 'AUTH_SERVICE_URL',
    fallbackUrl: 'http://auth-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'auth-service-strategy',
    endpoints: [
      { method: 'POST', path: '/signup', description: 'Register new user' },
      { method: 'POST', path: '/login', description: 'Login with email/password' },
      { method: 'POST', path: '/logout', description: 'Logout (invalidate tokens)' },
      { method: 'POST', path: '/refresh', description: 'Refresh access token' },
      { method: 'POST', path: '/forgot-password', description: 'Request password reset' },
      { method: 'POST', path: '/reset-password', description: 'Reset password with token' },
      { method: 'POST', path: '/verify-email', description: 'Verify email address' },
      { method: 'POST', path: '/resend-verification', description: 'Resend verification email' },
      { method: 'GET', path: '/me', description: 'Get authenticated user' },
      { method: 'POST', path: '/mfa/setup', description: 'Get MFA setup details' },
      { method: 'POST', path: '/mfa/verify', description: 'Verify MFA code' },
      { method: 'POST', path: '/mfa/enable', description: 'Enable MFA' },
      { method: 'POST', path: '/mfa/disable', description: 'Disable MFA' },
      { method: 'POST', path: '/social/google', description: 'Google OAuth login (legacy)' },
      {
        method: 'GET',
        path: '/social/google/authorize',
        description: 'Initiate Google OAuth flow with state',
      },
      { method: 'POST', path: '/social/apple', description: 'Apple OAuth login (legacy)' },
      {
        method: 'GET',
        path: '/social/apple/authorize',
        description: 'Initiate Apple OAuth flow with state',
      },
      {
        method: 'POST',
        path: '/social/callback',
        description: 'OAuth callback with state validation',
      },
      { method: 'POST', path: '/social/unlink', description: 'Unlink social account' },
      { method: 'POST', path: '/otp/send', description: 'Send OTP' },
      { method: 'POST', path: '/otp/verify', description: 'Verify OTP' },
      { method: 'GET', path: '/devices', description: 'List active devices' },
      { method: 'DELETE', path: '/devices/:deviceId', description: 'Revoke device session' },
      { method: 'PATCH', path: '/devices/:deviceId', description: 'Update device info' },
      { method: 'POST', path: '/devices/revoke-all', description: 'Revoke all devices' },
      { method: 'POST', path: '/select-role', description: 'Select user role' },
    ],
  },
  {
    path: '/users',
    envKey: 'USER_SERVICE_URL',
    fallbackUrl: 'http://user-service:3001',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'includes-prefix',
    endpoints: [
      { method: 'GET', path: '/me', description: 'Get current user profile' },
      { method: 'PATCH', path: '/me', description: 'Update current user profile' },
      { method: 'POST', path: '/me/complete-profile', description: 'Complete profile setup' },
      { method: 'GET', path: '/me/preferences', description: 'Get user preferences' },
      { method: 'PATCH', path: '/me/preferences', description: 'Update user preferences' },
      { method: 'GET', path: '/me/history', description: 'Get viewing history' },
      { method: 'POST', path: '/me/history', description: 'Add to viewing history' },
      { method: 'GET', path: '/me/saved', description: 'Get saved content' },
      { method: 'POST', path: '/me/saved', description: 'Save content' },
      { method: 'DELETE', path: '/me/saved/:contentId', description: 'Remove saved content' },
      { method: 'GET', path: '/me/universe-affinity', description: 'Get universe affinity' },
      { method: 'PATCH', path: '/me/universe-affinity', description: 'Update universe affinity' },
      { method: 'GET', path: '/me/universes', description: 'Get user universes' },
      { method: 'GET', path: '/me/continue-watching', description: 'Get continue watching' },
      { method: 'GET', path: '/me/privacy-settings', description: 'Get privacy settings' },
      { method: 'PUT', path: '/me/privacy-settings', description: 'Update privacy settings' },
      { method: 'GET', path: '/:id', description: 'Get user by ID' },
      { method: 'GET', path: '/:id/content', description: "Get user's content" },
      { method: 'POST', path: '/:id/follow', description: 'Follow a user' },
      { method: 'DELETE', path: '/:id/follow', description: 'Unfollow a user' },
      { method: 'GET', path: '/:id/followers', description: "Get user's followers" },
      { method: 'GET', path: '/:id/following', description: 'Get users being followed' },
    ],
  },
  {
    path: '/interactions',
    envKey: 'USER_SERVICE_URL',
    fallbackUrl: 'http://user-service:3001',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    endpoints: [
      { method: 'GET', path: '/watchlist', description: 'Get watchlist' },
      { method: 'DELETE', path: '/watchlist/:contentId', description: 'Remove from watchlist' },
      { method: 'GET', path: '/history', description: 'Get watch history' },
      { method: 'DELETE', path: '/history/:contentId', description: 'Remove from history' },
      { method: 'GET', path: '/favorites', description: 'Get favorites' },
      { method: 'POST', path: '/favorites', description: 'Add to favorites' },
      { method: 'DELETE', path: '/favorites/:contentId', description: 'Remove from favorites' },
    ],
  },
  {
    path: '/wallet',
    envKey: 'WALLET_SERVICE_URL',
    fallbackUrl: 'http://wallet-service:3002',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    endpoints: [
      { method: 'GET', path: '/', description: "Get current user's wallet" },
      { method: 'GET', path: '/balance', description: 'Get wallet balance (alias)' },
      { method: 'GET', path: '/transactions', description: 'Get transaction history' },
      { method: 'GET', path: '/summary', description: 'Get wallet summary' },
      { method: 'GET', path: '/pricing', description: 'Get wallet pricing' },
      { method: 'GET', path: '/accounts', description: 'Get linked bank accounts' },
      { method: 'GET', path: '/bank-accounts', description: 'Get linked bank accounts (alias)' },
      { method: 'POST', path: '/bank-accounts', description: 'Link bank account' },
      { method: 'GET', path: '/withdrawal-methods', description: 'Get withdrawal methods' },
      { method: 'GET', path: '/withdrawal-pricing', description: 'Get withdrawal pricing' },
      { method: 'GET', path: '/payment-methods', description: 'Get payment methods' },
      { method: 'POST', path: '/fund', description: 'Fund wallet' },
      { method: 'POST', path: '/deposit', description: 'Deposit funds (alias for fund)' },
      { method: 'POST', path: '/redeem-reward', description: 'Redeem reward points' },
      { method: 'POST', path: '/bonus-credit', description: 'Add bonus credit' },
      { method: 'POST', path: '/promo-credit', description: 'Add promo credit' },
      { method: 'GET', path: '/audit-trail', description: 'Get audit trail' },
      { method: 'POST', path: '/debit', description: 'Debit wallet' },
      { method: 'POST', path: '/credit', description: 'Credit wallet' },
      { method: 'POST', path: '/withdraw', description: 'Withdraw funds' },
      { method: 'POST', path: '/transfer', description: 'Transfer to another user' },
      { method: 'GET', path: '/transactions/:id', description: 'Get transaction details' },
    ],
  },
  {
    path: '/pricing',
    envKey: 'PAYMENT_SERVICE_URL',
    fallbackUrl: 'http://payment-service:3003',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/vote-packages/:type', description: 'Get vote packages by type' },
      { method: 'GET', path: '/wallet', description: 'Get wallet pricing' },
      { method: 'GET', path: '/subscriptions', description: 'Get subscription pricing' },
      { method: 'GET', path: '/movie', description: 'Get movie pricing' },
      { method: 'GET', path: '/passes', description: 'Get pass pricing' },
    ],
  },
  {
    path: '/payments',
    envKey: 'PAYMENT_SERVICE_URL',
    fallbackUrl: 'http://payment-service:3003',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'POST', path: '/initialize', description: 'Initialize a payment' },
      { method: 'POST', path: '/verify', description: 'Verify a payment' },
      { method: 'GET', path: '/history', description: 'Get payment history' },
      { method: 'GET', path: '/:id', description: 'Get payment details' },
      { method: 'POST', path: '/intent', description: 'Create payment intent' },
      { method: 'GET', path: '/providers', description: 'List payment providers' },
      { method: 'POST', path: '/refund-request', description: 'Request a refund' },
    ],
  },
  {
    path: '/public',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/public/settings', description: 'Get public settings' },
      { method: 'GET', path: '/public/settings/:key', description: 'Get a public setting' },
      { method: 'GET', path: '/public/universes', description: 'Get enabled universes' },
      {
        method: 'GET',
        path: '/public/universes/:name/features',
        description: 'Get universe features',
      },
    ],
  },
  {
    path: '/content',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List content (with filters)' },
      { method: 'GET', path: '/home', description: 'Get home feed' },
      { method: 'GET', path: '/watch', description: 'Get watch hub feed' },
      { method: 'GET', path: '/search', description: 'Search content' },
      { method: 'GET', path: '/trending', description: 'Get trending content' },
      { method: 'GET', path: '/new-releases', description: 'Get new releases' },
      { method: 'GET', path: '/featured-slides', description: 'Get featured slides' },
      { method: 'GET', path: '/popular-region', description: 'Get popular in region' },
      { method: 'GET', path: '/featured', description: 'Get featured content' },
      { method: 'GET', path: '/accessible', description: 'Get accessible content for user' },
      { method: 'GET', path: '/recommended', description: 'Get recommended content' },
      { method: 'GET', path: '/me', description: "Get current user's content" },
      { method: 'GET', path: '/creator/:creatorId', description: "Get creator's content" },
      { method: 'GET', path: '/:id', description: 'Get content details' },
      { method: 'POST', path: '/', description: 'Create content (creators)' },
      { method: 'PATCH', path: '/:id', description: 'Update content' },
      { method: 'DELETE', path: '/:id', description: 'Delete content' },
      { method: 'GET', path: '/:id/comments', description: 'Get content comments' },
      { method: 'POST', path: '/:id/comments', description: 'Add comment' },
      { method: 'GET', path: '/:id/analytics', description: 'Get content analytics' },
      { method: 'POST', path: '/:id/publish', description: 'Publish content' },
      { method: 'POST', path: '/:id/unpublish', description: 'Unpublish content' },
      { method: 'GET', path: '/:id/media', description: 'Get media asset' },
      { method: 'POST', path: '/:id/media', description: 'Create media asset' },
      { method: 'GET', path: '/:id/media/signed-url', description: 'Get signed media URL' },
      { method: 'GET', path: '/:id/related', description: 'Get related content' },
      { method: 'POST', path: '/:id/report', description: 'Report content' },
      { method: 'GET', path: '/:id/access-check', description: 'Check content access' },
      { method: 'GET', path: '/:id/playback-url', description: 'Get playback URL' },
      { method: 'GET', path: '/categories', description: 'Get all categories' },
      { method: 'GET', path: '/tags', description: 'Get all tags' },
    ],
  },
  {
    path: '/search',
    envKey: 'SEARCH_SERVICE_URL',
    fallbackUrl: 'http://search-service:3005',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'Universal search' },
      { method: 'GET', path: '/faceted', description: 'Faceted search' },
      { method: 'GET', path: '/suggestions', description: 'Get search suggestions' },
      { method: 'GET', path: '/trending', description: 'Get trending searches' },
      { method: 'GET', path: '/facets', description: 'Get search facets' },
      { method: 'POST', path: '/log', description: 'Log search query' },
      { method: 'GET', path: '/metrics', description: 'Prometheus metrics' },
      { method: 'GET', path: '/admin/stats', description: 'Search service stats (admin)' },
      { method: 'GET', path: '/admin/queries', description: 'Search query log (admin)' },
      {
        method: 'POST',
        path: '/admin/indexes/repair',
        description:
          'Recreate missing GIN trigram indexes (self-heal; Alertmanager webhook target)',
      },
    ],
  },
  {
    path: '/notifications',
    envKey: 'NOTIFICATION_SERVICE_URL',
    fallbackUrl: 'http://notification-service:3006',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List user notifications' },
      { method: 'PATCH', path: '/:id/read', description: 'Mark notification as read' },
      { method: 'PATCH', path: '/read-all', description: 'Mark all as read' },
      { method: 'PUT', path: '/preferences', description: 'Update notification preferences' },
      { method: 'GET', path: '/settings', description: 'Get notification settings' },
      { method: 'GET', path: '/unread-count', description: 'Get unread count' },
      { method: 'POST', path: '/push-tokens', description: 'Save push token' },
      { method: 'GET', path: '/push-tokens', description: 'Get push tokens' },
      { method: 'DELETE', path: '/push-tokens/:token', description: 'Delete push token' },
      { method: 'POST', path: '/register-token', description: 'Register push token' },
    ],
  },
  {
    path: '/rewards',
    envKey: 'REWARD_SERVICE_URL',
    fallbackUrl: 'http://reward-service:3007',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get user rewards' },
      { method: 'POST', path: '/earn', description: 'Earn reward points' },
      { method: 'POST', path: '/redeem', description: 'Redeem reward points' },
      { method: 'GET', path: '/history', description: 'Get reward history' },
      { method: 'GET', path: '/levels', description: 'Get available reward levels' },
      { method: 'POST', path: '/claim', description: 'Claim a reward' },
    ],
  },
  {
    path: '/analytics',
    envKey: 'ANALYTICS_SERVICE_URL',
    fallbackUrl: 'http://analytics-service:3008',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'POST', path: '/events', description: 'Track analytics event' },
      { method: 'POST', path: '/events/batch', description: 'Track batch events' },
      { method: 'GET', path: '/kpis', description: 'Get platform KPIs' },
      { method: 'GET', path: '/funnel', description: 'Get funnel analytics' },
      { method: 'GET', path: '/cohort', description: 'Get cohort analytics' },
      { method: 'GET', path: '/search/corrections', description: 'Search correction acceptance' },
    ],
  },
  {
    path: '/recommendation',
    envKey: 'RECOMMENDATION_SERVICE_URL',
    fallbackUrl: 'http://recommendation-service:3009',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'includes-prefix',
    endpoints: [
      { method: 'GET', path: '/content', description: 'Get content recommendations' },
      { method: 'GET', path: '/creators', description: 'Get creator recommendations' },
      { method: 'GET', path: '/cross-universe', description: 'Get cross-universe recommendations' },
      { method: 'GET', path: '/trending', description: 'Get trending content' },
      { method: 'GET', path: '/user-segment', description: 'Get user segment' },
      { method: 'GET', path: '/creator-score', description: 'Get creator score' },
      { method: 'GET', path: '/churn-risk', description: 'Get churn risk assessment' },
      { method: 'GET', path: '/monetization-insights', description: 'Get monetization insights' },
      { method: 'GET', path: '/fraud-risk', description: 'Assess fraud risk' },
      { method: 'GET', path: '/personalized-feed', description: 'Get personalized feed' },
    ],
  },
  {
    path: '/admin',
    envKey: 'ADMIN_SERVICE_URL',
    fallbackUrl: 'http://localhost:4016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    pathRewrite: { '^/v1': '' },
    endpoints: [
      { method: 'GET', path: '/dashboard/stats', description: 'Get admin dashboard stats' },
      { method: 'GET', path: '/dashboard/revenue', description: 'Get revenue data' },
      { method: 'GET', path: '/dashboard/content', description: 'Get content metrics' },
      { method: 'GET', path: '/dashboard/engagement', description: 'Get engagement metrics' },
      { method: 'GET', path: '/dashboard/growth', description: 'Get growth metrics' },
      { method: 'GET', path: '/dashboard/financial', description: 'Get financial metrics' },
      { method: 'GET', path: '/dashboard/platform-overview', description: 'Get platform overview' },
      { method: 'GET', path: '/users', description: 'List users' },
      { method: 'GET', path: '/users/:id', description: 'Get user details' },
      { method: 'PUT', path: '/users/:id/role', description: 'Update user role' },
      { method: 'PATCH', path: '/users/:id/status', description: 'Update user status' },
      { method: 'GET', path: '/content', description: 'List content for moderation' },
      { method: 'GET', path: '/content/:id', description: 'Get content details' },
      { method: 'PATCH', path: '/content/:id/status', description: 'Update content status' },
      { method: 'GET', path: '/analytics/overview', description: 'Get analytics overview' },
      { method: 'GET', path: '/analytics/revenue', description: 'Get revenue analytics' },
      { method: 'GET', path: '/analytics/users', description: 'Get user analytics' },
      { method: 'GET', path: '/wallets', description: 'List wallets' },
      { method: 'GET', path: '/wallets/stats', description: 'Get wallet stats' },
      { method: 'GET', path: '/wallets/:id/transactions', description: 'Get wallet transactions' },
      { method: 'GET', path: '/content-review', description: 'Get content review queue' },
      { method: 'POST', path: '/content-review/:id/approve', description: 'Approve content' },
      { method: 'POST', path: '/content-review/:id/reject', description: 'Reject content' },
      { method: 'GET', path: '/engagement/metrics', description: 'Get engagement metrics' },
      { method: 'GET', path: '/engagement/trends', description: 'Get engagement trends' },
      { method: 'GET', path: '/notifications/stats', description: 'Get notification stats' },
      { method: 'GET', path: '/notifications', description: 'Get admin notifications' },
      { method: 'GET', path: '/notification-templates', description: 'Get notification templates' },
      {
        method: 'POST',
        path: '/notification-templates',
        description: 'Create notification template',
      },
      {
        method: 'PUT',
        path: '/notification-templates/:id',
        description: 'Update notification template',
      },
      { method: 'GET', path: '/payment-gateways', description: 'Get payment gateways' },
      {
        method: 'PUT',
        path: '/payment-gateways/:id/toggle',
        description: 'Toggle payment gateway',
      },
      {
        method: 'PUT',
        path: '/payment-gateways/:id/mode',
        description: 'Update payment gateway mode',
      },
      { method: 'GET', path: '/reality-shows', description: 'Get reality shows' },
      {
        method: 'PUT',
        path: '/reality-shows/:id/status',
        description: 'Update reality show status',
      },
      { method: 'GET', path: '/reports', description: 'Get reports' },
      { method: 'POST', path: '/reports', description: 'Create report' },
      { method: 'POST', path: '/reports/execute', description: 'Execute report' },
      { method: 'DELETE', path: '/reports/:id', description: 'Delete report' },
      { method: 'GET', path: '/config', description: 'Get platform config' },
      { method: 'PATCH', path: '/config', description: 'Update platform config' },
      {
        method: 'GET',
        path: '/feature-flags',
        description: 'List global feature flags with defaults',
      },
      {
        method: 'GET',
        path: '/feature-flags/known',
        description: 'Typed known-flags reference (from registries)',
      },
      {
        method: 'GET',
        path: '/feature-flags/stale',
        description: 'List stale feature flags (removal candidates)',
      },
      {
        method: 'GET',
        path: '/feature-flags/stale/metrics',
        description:
          'Per-key flag_stale_running_total (which stale flags are actively served past expiry)',
      },
      {
        method: 'POST',
        path: '/feature-flags/prune-stale',
        description: 'Batch-remove stale flags (archiving each before deletion)',
      },
      {
        method: 'POST',
        path: '/feature-flags/stale-sweep/run',
        description: 'Run the stale-flag sweep now (notify owners)',
      },
      {
        method: 'POST',
        path: '/feature-flags/nightly/run',
        description:
          'Run the nightly stale-flag pass now (owner sweep → auto-prune → ops-channel summary)',
      },
      {
        method: 'GET',
        path: '/feature-flags/deleted',
        description: 'Recently deleted flags (restorable from audit snapshots)',
      },
      {
        method: 'POST',
        path: '/feature-flags/restore',
        description: 'Restore deleted flags from archived audit snapshots (undo)',
      },
      {
        method: 'PUT',
        path: '/feature-flags/:key',
        description: 'Set a global feature flag value',
      },
      {
        method: 'DELETE',
        path: '/feature-flags/:key',
        description: 'Reset a global feature flag to its default',
      },
      { method: 'GET', path: '/audit-logs', description: 'Get audit logs' },
      { method: 'GET', path: '/audit-logs/actor/:actorId', description: 'Get audit logs by actor' },
      {
        method: 'GET',
        path: '/audit-logs/target/:targetType/:targetId',
        description: 'Get audit logs by target',
      },
      { method: 'PUT', path: '/wallets/:walletId/status', description: 'Update wallet status' },
      { method: 'GET', path: '/moderation/queue', description: 'Get moderation queue' },
      { method: 'PATCH', path: '/moderation/:id', description: 'Update moderation status' },
      { method: 'GET', path: '/support/tickets', description: 'Get support tickets' },
      { method: 'PATCH', path: '/support/tickets/:id', description: 'Update ticket' },
      { method: 'GET', path: '/universes', description: 'List universes' },
      { method: 'GET', path: '/universes/:id', description: 'Get universe by ID' },
      { method: 'GET', path: '/universes/name/:name', description: 'Get universe by name' },
      { method: 'GET', path: '/universes/enabled', description: 'Get enabled universes' },
      {
        method: 'GET',
        path: '/universes/check/:universeName/:featureKey',
        description: 'Check feature flag',
      },
      { method: 'POST', path: '/universes', description: 'Create universe' },
      { method: 'PUT', path: '/universes/:id', description: 'Update universe' },
      { method: 'DELETE', path: '/universes/:id', description: 'Delete universe' },
      { method: 'PUT', path: '/universes/:id/toggle', description: 'Toggle universe enabled' },
      { method: 'PUT', path: '/universes/:id/feature-flags', description: 'Update feature flag' },
      {
        method: 'POST',
        path: '/universes/feature-flags/prune-stale',
        description: 'Batch-remove stale universe flags (archiving each before deletion)',
      },
      {
        method: 'POST',
        path: '/universes/feature-flags/restore',
        description: 'Restore pruned universe flags from their archived audit snapshots (undo)',
      },
      {
        method: 'GET',
        path: '/universes/feature-flags/deleted',
        description: 'Recently deleted universe flags (restorable from audit snapshots)',
      },
      {
        method: 'DELETE',
        path: '/universes/:id/feature-flags/:featureKey',
        description: 'Delete feature flag',
      },
      { method: 'GET', path: '/settings', description: 'Get all settings' },
      { method: 'GET', path: '/settings/public', description: 'Get public settings' },
      { method: 'GET', path: '/settings/map', description: 'Get settings map' },
      {
        method: 'GET',
        path: '/settings/category/:category',
        description: 'Get settings by category',
      },
      { method: 'GET', path: '/settings/value/:key', description: 'Get setting value' },
      { method: 'GET', path: '/settings/:key', description: 'Get setting by key' },
      { method: 'POST', path: '/settings', description: 'Create setting' },
      { method: 'PUT', path: '/settings/:key', description: 'Update setting' },
      { method: 'DELETE', path: '/settings/:key', description: 'Delete setting' },
      { method: 'POST', path: '/settings/bulk', description: 'Bulk create settings' },
      { method: 'PUT', path: '/settings/bulk', description: 'Bulk update settings' },
      { method: 'GET', path: '/settings/export', description: 'Export all settings' },
      { method: 'POST', path: '/settings/import', description: 'Import settings' },
      { method: 'POST', path: '/settings/save-draft', description: 'Save settings draft' },
      { method: 'GET', path: '/settings/draft/:key', description: 'Get settings draft' },
      { method: 'DELETE', path: '/settings/draft/:key', description: 'Delete settings draft' },
      { method: 'GET', path: '/settings/:key/history', description: 'Get setting version history' },
      { method: 'GET', path: '/settings/branding', description: 'Get branding settings' },
      { method: 'PUT', path: '/settings/branding', description: 'Update branding settings' },
      {
        method: 'GET',
        path: '/settings/subscriptions/plans',
        description: 'List subscription plans',
      },
      {
        method: 'POST',
        path: '/settings/subscriptions/plans',
        description: 'Create subscription plan',
      },
      {
        method: 'PUT',
        path: '/settings/subscriptions/plans/:id',
        description: 'Update subscription plan',
      },
      {
        method: 'DELETE',
        path: '/settings/subscriptions/plans/:id',
        description: 'Delete subscription plan',
      },
      { method: 'GET', path: '/settings/site', description: 'Get site settings' },
      { method: 'PUT', path: '/settings/site', description: 'Update site settings' },
      { method: 'GET', path: '/settings/access/roles', description: 'Get RBAC roles' },
      {
        method: 'PUT',
        path: '/settings/access/roles/:role',
        description: 'Update role permissions',
      },
      { method: 'GET', path: '/settings/access/admins', description: 'List admin users' },
      { method: 'POST', path: '/settings/access/admins', description: 'Create admin user' },
      { method: 'DELETE', path: '/settings/access/admins/:id', description: 'Remove admin user' },
      { method: 'GET', path: '/settings/performance', description: 'Get performance settings' },
      { method: 'PUT', path: '/settings/performance', description: 'Update performance settings' },
      { method: 'GET', path: '/settings/notifications', description: 'Get notification settings' },
      {
        method: 'PUT',
        path: '/settings/notifications',
        description: 'Update notification settings',
      },
      {
        method: 'GET',
        path: '/settings/notifications/templates',
        description: 'List email templates',
      },
      {
        method: 'POST',
        path: '/settings/notifications/templates',
        description: 'Create email template',
      },
      {
        method: 'PUT',
        path: '/settings/notifications/templates/:id',
        description: 'Update email template',
      },
      {
        method: 'DELETE',
        path: '/settings/notifications/templates/:id',
        description: 'Delete email template',
      },
      { method: 'GET', path: '/settings/integrations', description: 'List integrations' },
      {
        method: 'PUT',
        path: '/settings/integrations/:provider',
        description: 'Update integration',
      },
      {
        method: 'POST',
        path: '/settings/integrations/:provider/test',
        description: 'Test integration',
      },
      { method: 'GET', path: '/settings/compliance', description: 'Get compliance settings' },
      { method: 'PUT', path: '/settings/compliance', description: 'Update compliance settings' },
      {
        method: 'GET',
        path: '/settings/compliance/data-retention',
        description: 'Get data retention',
      },
      {
        method: 'PUT',
        path: '/settings/compliance/data-retention',
        description: 'Update data retention',
      },
      { method: 'GET', path: '/settings/localization', description: 'Get localization settings' },
      {
        method: 'PUT',
        path: '/settings/localization',
        description: 'Update localization settings',
      },
      { method: 'GET', path: '/settings/security', description: 'Get security settings' },
      { method: 'PUT', path: '/settings/security', description: 'Update security settings' },
      { method: 'GET', path: '/settings/security/ip-rules', description: 'Get IP rules' },
      { method: 'PUT', path: '/settings/security/ip-rules', description: 'Update IP rules' },
      { method: 'GET', path: '/content-management', description: 'List all content' },
      { method: 'GET', path: '/content-management/stats', description: 'Content statistics' },
      { method: 'GET', path: '/content-management/categories', description: 'List categories' },
      { method: 'POST', path: '/content-management/categories', description: 'Create category' },
      { method: 'PUT', path: '/content-management/categories/:id', description: 'Update category' },
      {
        method: 'DELETE',
        path: '/content-management/categories/:id',
        description: 'Delete category',
      },
      { method: 'GET', path: '/content-management/tags', description: 'List tags' },
      { method: 'POST', path: '/content-management/tags', description: 'Create tag' },
      { method: 'DELETE', path: '/content-management/tags/:id', description: 'Delete tag' },
      {
        method: 'GET',
        path: '/content-management/versions/:id',
        description: 'Content version history',
      },
      { method: 'GET', path: '/content-management/audit', description: 'Content audit logs' },
      {
        method: 'POST',
        path: '/content-management/bulk/status',
        description: 'Bulk update status',
      },
      { method: 'POST', path: '/content-management/bulk/delete', description: 'Bulk soft delete' },
      { method: 'GET', path: '/content-management/:id', description: 'Get content by ID' },
      { method: 'POST', path: '/content-management', description: 'Create content' },
      { method: 'PATCH', path: '/content-management/:id', description: 'Update content' },
      { method: 'DELETE', path: '/content-management/:id', description: 'Delete content' },
      { method: 'POST', path: '/content-management/:id/publish', description: 'Publish content' },
      {
        method: 'POST',
        path: '/content-management/:id/unpublish',
        description: 'Unpublish content',
      },
      { method: 'GET', path: '/universes/stats', description: 'Universe statistics' },
      { method: 'GET', path: '/universes/feature-flags', description: 'All feature flags' },
      { method: 'GET', path: '/universes/relationships', description: 'Universe relationships' },
      { method: 'GET', path: '/universes/export/:id', description: 'Export universe' },
      { method: 'POST', path: '/universes/import', description: 'Import universes' },
      { method: 'POST', path: '/universes/bulk/toggle', description: 'Bulk toggle universes' },
      { method: 'POST', path: '/universes/:id/copy', description: 'Clone universe' },
    ],
  },
  {
    path: '/creator',
    // The standalone creator dashboard app (:4014), NOT the creator
    // microservice (:3018) — a dedicated env key so /creator and /creators
    // can point at different upstreams.
    envKey: 'CREATOR_APP_URL',
    fallbackUrl: 'http://localhost:4014',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    pathRewrite: { '^/v1': '' },
    endpoints: [
      { method: 'GET', path: '/dashboard', description: 'Get creator dashboard' },
      { method: 'GET', path: '/dashboard/analytics', description: 'Get creator analytics' },
      { method: 'GET', path: '/dashboard/earnings', description: 'Get creator earnings' },
      { method: 'GET', path: '/dashboard/content', description: 'Get creator content' },
      { method: 'POST', path: '/upload', description: 'Upload content' },
      { method: 'GET', path: '/uploads', description: 'List uploads' },
      { method: 'PATCH', path: '/uploads/:id', description: 'Update upload' },
      { method: 'DELETE', path: '/uploads/:id', description: 'Delete upload' },
      { method: 'GET', path: '/profile', description: 'Get creator profile' },
      { method: 'PATCH', path: '/profile', description: 'Update creator profile' },
      { method: 'GET', path: '/monetization', description: 'Get monetization settings' },
      { method: 'PATCH', path: '/monetization', description: 'Update monetization settings' },
      { method: 'GET', path: '/payouts', description: 'Get payout history' },
      { method: 'POST', path: '/payouts/request', description: 'Request payout' },
      { method: 'PUT', path: '/payouts/settings', description: 'Update payout settings' },
      { method: 'GET', path: '/settings', description: 'Get creator settings' },
      { method: 'PUT', path: '/settings', description: 'Update creator settings' },
      { method: 'GET', path: '/subscribers', description: 'Get subscribers' },
    ],
  },
  {
    path: '/creators',
    envKey: 'CREATOR_SERVICE_URL',
    fallbackUrl: 'http://creator-service:3018',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'POST', path: '/onboard', description: 'Creator onboarding' },
      { method: 'GET', path: '/me', description: 'Get my creator profile' },
      { method: 'PATCH', path: '/me', description: 'Update creator profile' },
      { method: 'GET', path: '/:creatorId', description: 'Get creator public profile' },
      { method: 'POST', path: '/channels', description: 'Create channel' },
      { method: 'GET', path: '/channels', description: 'List my channels' },
      { method: 'POST', path: '/uploads', description: 'Create upload' },
      { method: 'GET', path: '/uploads', description: 'List own uploads' },
      { method: 'GET', path: '/discover', description: 'Creator discovery' },
      { method: 'GET', path: '/stats', description: 'Get creator stats' },
      { method: 'GET', path: '/settings', description: 'Get creator settings' },
      { method: 'PUT', path: '/settings', description: 'Update creator settings' },
      { method: 'GET', path: '/:creatorId/content', description: "Get creator's content" },
      {
        method: 'PUT',
        path: '/monetization/settings',
        description: 'Update monetization settings',
      },
      { method: 'POST', path: '/tips/:creatorId', description: 'Send tip to creator' },
      { method: 'GET', path: '/tips/leaderboard/:creatorId', description: 'Get tip leaderboard' },
      { method: 'GET', path: '/tips/stats/:creatorId', description: 'Get tip statistics' },
      { method: 'GET', path: '/users/me/tips', description: 'Get my tipping history' },
      { method: 'POST', path: '/subscribe/:creatorId', description: 'Subscribe to creator' },
      { method: 'DELETE', path: '/subscribe/:creatorId', description: 'Cancel subscription' },
      { method: 'GET', path: '/subscriptions', description: 'Get my subscriptions' },
      { method: 'GET', path: '/subscribers', description: 'Get my subscribers' },
      { method: 'GET', path: '/earnings', description: 'Get creator earnings' },
      { method: 'POST', path: '/payouts', description: 'Request payout' },
      { method: 'GET', path: '/payouts', description: 'Get payout history' },
      { method: 'GET', path: '/analytics', description: 'Get creator analytics' },
    ],
  },
  {
    path: '/moderation',
    envKey: 'MODERATION_SERVICE_URL',
    fallbackUrl: 'http://moderation-service:3022',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'POST', path: '/report', description: 'Report content/user' },
      { method: 'GET', path: '/report-types', description: 'List report types' },
      { method: 'POST', path: '/appeal', description: 'Submit appeal' },
      { method: 'GET', path: '/queue', description: 'Get moderation queue' },
      { method: 'GET', path: '/trust-score/:userId', description: 'Get user trust score' },
      { method: 'POST', path: '/safety-action', description: 'Take safety action' },
      { method: 'GET', path: '/safety-actions', description: 'Get safety actions' },
      { method: 'POST', path: '/scan', description: 'Scan content media' },
      { method: 'GET', path: '/scan/:scanId', description: 'Get scan result' },
      { method: 'GET', path: '/content/:contentId/safety', description: 'Check content safety' },
    ],
  },
  {
    path: '/support',
    envKey: 'SUPPORT_SERVICE_URL',
    fallbackUrl: 'http://support-service:3020',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'POST', path: '/tickets', description: 'Create ticket' },
      { method: 'GET', path: '/tickets', description: 'Get tickets' },
      { method: 'GET', path: '/tickets/my', description: 'Get my tickets' },
      { method: 'GET', path: '/tickets/:id', description: 'Get ticket by ID' },
      { method: 'PATCH', path: '/tickets/:id/status', description: 'Update ticket status' },
      { method: 'POST', path: '/tickets/:id/messages', description: 'Add message to ticket' },
      { method: 'POST', path: '/tickets/:id/assign', description: 'Assign ticket' },
      { method: 'POST', path: '/tickets/:id/escalate', description: 'Escalate ticket' },
      { method: 'POST', path: '/tickets/:id/close', description: 'Close ticket' },
      { method: 'POST', path: '/refunds', description: 'Request refund' },
      { method: 'GET', path: '/refunds/my', description: 'Get my refunds' },
      { method: 'GET', path: '/refunds/pending', description: 'Get pending refunds' },
      { method: 'POST', path: '/disputes', description: 'Create dispute' },
      { method: 'POST', path: '/chargebacks', description: 'Create chargeback' },
      { method: 'POST', path: '/appeals', description: 'Submit appeal' },
      { method: 'POST', path: '/takedowns', description: 'Create takedown request' },
      { method: 'POST', path: '/suspensions', description: 'Suspend user' },
      { method: 'GET', path: '/dashboard/stats', description: 'Get dashboard stats' },
    ],
  },
  {
    path: '/engagement',
    envKey: 'ENGAGEMENT_SERVICE_URL',
    fallbackUrl: 'http://engagement-service:3023',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/leaderboard', description: 'Get leaderboard' },
      { method: 'GET', path: '/rankings', description: 'Get rankings by category' },
      {
        method: 'GET',
        path: '/predictions/:contentId/results',
        description: 'Get prediction results',
      },
      { method: 'POST', path: '/predictions', description: 'Submit a prediction' },
    ],
  },
  {
    path: '/messaging',
    envKey: 'MESSAGING_SERVICE_URL',
    fallbackUrl: 'http://messaging-service:3024',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/conversations', description: 'Get conversations' },
      { method: 'POST', path: '/conversations', description: 'Create conversation' },
      { method: 'GET', path: '/conversations/:id/messages', description: 'Get messages' },
      { method: 'POST', path: '/conversations/:id/messages', description: 'Send message' },
      { method: 'POST', path: '/conversations/:id/read', description: 'Mark as read' },
      { method: 'PUT', path: '/conversations/:id/mute', description: 'Mute conversation' },
      { method: 'PUT', path: '/conversations/:id/archive', description: 'Archive conversation' },
      { method: 'DELETE', path: '/conversations/:id', description: 'Delete conversation' },
      { method: 'PUT', path: '/messages/:messageId', description: 'Edit message' },
      { method: 'DELETE', path: '/messages/:messageId', description: 'Delete message' },
      { method: 'PUT', path: '/messages/:messageId/pin', description: 'Pin/unpin message' },
      { method: 'POST', path: '/conversations/:id/messages/:messageId/react', description: 'React to message' },
    ],
  },
  {
    path: '/referrals',
    envKey: 'REFERRAL_SERVICE_URL',
    fallbackUrl: 'http://referral-service:3025',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/code', description: 'Get referral code' },
      { method: 'POST', path: '/generate', description: 'Generate new referral code' },
      { method: 'POST', path: '/apply', description: 'Apply referral code' },
      { method: 'GET', path: '/', description: 'Get user referrals' },
      { method: 'GET', path: '/stats', description: 'Get referral statistics' },
      { method: 'POST', path: '/complete/:referralId', description: 'Complete a referral' },
    ],
  },
  {
    path: '/subscription',
    envKey: 'SUBSCRIPTION_SERVICE_URL',
    fallbackUrl: 'http://subscription-service:3026',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/plans', description: 'Get subscription plans' },
      { method: 'GET', path: '/plans/:id', description: 'Get plan by ID' },
      { method: 'POST', path: '/plans', description: 'Create plan (admin)' },
      { method: 'PUT', path: '/plans/:id', description: 'Update subscription plan' },
      { method: 'DELETE', path: '/plans/:id', description: 'Delete subscription plan' },
      { method: 'POST', path: '/subscribe', description: 'Subscribe to a plan' },
      { method: 'POST', path: '/renew/:id', description: 'Renew subscription' },
      { method: 'GET', path: '/current', description: 'Get current subscription' },
      { method: 'DELETE', path: '/:id', description: 'Cancel subscription' },
      { method: 'GET', path: '/history', description: 'Get subscription history' },
      { method: 'GET', path: '/bundles', description: 'Get available bundles' },
      { method: 'GET', path: '/bundles/compare', description: 'Compare bundle pricing' },
      { method: 'GET', path: '/bundles/:id', description: 'Get bundle details' },
      { method: 'POST', path: '/bundles', description: 'Create bundle (admin)' },
      { method: 'PUT', path: '/bundles/:id', description: 'Update bundle (admin)' },
      { method: 'DELETE', path: '/bundles/:id', description: 'Delete bundle (admin)' },
      { method: 'POST', path: '/bundles/:id/subscribe', description: 'Subscribe to a bundle' },
      { method: 'DELETE', path: '/bundles/:id/cancel', description: 'Cancel bundle subscription' },
      { method: 'GET', path: '/bundles/current', description: 'Get current bundle subscription' },
    ],
  },
  {
    path: '/media',
    envKey: 'MEDIA_SERVICE_URL',
    fallbackUrl: 'http://media-service:3019',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'POST', path: '/upload/image', description: 'Upload image' },
      { method: 'POST', path: '/upload/video', description: 'Upload video' },
      { method: 'POST', path: '/upload/avatar', description: 'Upload avatar' },
      { method: 'GET', path: '/presigned/upload', description: 'Get presigned upload URL' },
      { method: 'GET', path: '/presigned/download', description: 'Get presigned download URL' },
      { method: 'GET', path: '/metadata', description: 'Get file metadata' },
      { method: 'DELETE', path: '/:key', description: 'Delete file' },
      {
        method: 'POST',
        path: '/admin/cdn/purge',
        description: 'Purge cached media from the CDN (admin)',
      },
    ],
  },
  {
    path: '/universe',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    pathRewrite: { '/universe': '/content' },
    endpoints: [{ method: 'GET', path: '/:id', description: 'Get universe by ID' }],
  },
  {
    path: '/comedy',
    envKey: 'COMEDY_SERVICE_URL',
    fallbackUrl: 'http://comedy-service:3012',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List comedy content' },
      { method: 'GET', path: '/trending', description: 'Get trending comedy' },
      { method: 'GET', path: '/categories', description: 'Comedy categories' },
      { method: 'GET', path: '/comedians', description: 'List comedians' },
      { method: 'GET', path: '/comedians/:id', description: 'Comedian details' },
      { method: 'GET', path: '/creators', description: 'Comedy creators' },
      { method: 'GET', path: '/specials', description: 'Comedy specials' },
      { method: 'GET', path: '/specials/:id', description: 'Special details' },
      { method: 'GET', path: '/series', description: 'Comedy series' },
      { method: 'GET', path: '/clips', description: 'Comedy clips' },
      { method: 'GET', path: '/top-rated', description: 'Top rated comedy' },
      { method: 'GET', path: '/challenges', description: 'Comedy challenges' },
      { method: 'GET', path: '/:id', description: 'Get comedy content details' },
      { method: 'POST', path: '/', description: 'Create comedy content' },
      { method: 'PATCH', path: '/:id', description: 'Update comedy content' },
      { method: 'DELETE', path: '/:id', description: 'Delete comedy content' },
    ],
  },
  {
    path: '/games',
    envKey: 'GAMES_SERVICE_URL',
    fallbackUrl: 'http://games-service:3014',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List games' },
      { method: 'GET', path: '/trending', description: 'Get trending games' },
      { method: 'GET', path: '/:id', description: 'Get game details' },
      { method: 'POST', path: '/', description: 'Create game content' },
      { method: 'PATCH', path: '/:id', description: 'Update game content' },
      { method: 'DELETE', path: '/:id', description: 'Delete game content' },
    ],
  },
  {
    path: '/reality',
    envKey: 'REALITY_SERVICE_URL',
    fallbackUrl: 'http://reality-service:3010',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List reality content' },
      { method: 'GET', path: '/trending', description: 'Get trending reality content' },
      { method: 'GET', path: '/:id', description: 'Get reality content details' },
      { method: 'POST', path: '/', description: 'Create reality content' },
      { method: 'PATCH', path: '/:id', description: 'Update reality content' },
      { method: 'DELETE', path: '/:id', description: 'Delete reality content' },
    ],
  },
  {
    // movie-service controllers are @Controller('movies') — plural — so the
    // gateway route must be /movies (web app calls /api/v1/movies/*).
    path: '/movies',
    envKey: 'MOVIE_SERVICE_URL',
    fallbackUrl: 'http://movie-service:3011',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List movies' },
      { method: 'GET', path: '/featured', description: 'Featured movies' },
      { method: 'GET', path: '/trending', description: 'Get trending movies' },
      { method: 'GET', path: '/african', description: 'African movies' },
      { method: 'GET', path: '/hollywood', description: 'Hollywood movies' },
      { method: 'GET', path: '/premieres', description: 'Movie premieres' },
      { method: 'GET', path: '/passes', description: 'Cinema passes' },
      { method: 'GET', path: '/watchlist', description: 'User watchlist' },
      { method: 'POST', path: '/watchlist', description: 'Add to watchlist' },
      { method: 'DELETE', path: '/watchlist/:movieId', description: 'Remove from watchlist' },
      { method: 'GET', path: '/me/library', description: 'User library' },
      { method: 'GET', path: '/:id', description: 'Get movie details' },
      { method: 'POST', path: '/:id/rent', description: 'Rent movie' },
      { method: 'POST', path: '/:id/rate', description: 'Rate movie' },
      { method: 'GET', path: '/:id/availability', description: 'Check availability' },
      { method: 'POST', path: '/', description: 'Create movie content' },
      { method: 'PATCH', path: '/:id', description: 'Update movie content' },
      { method: 'DELETE', path: '/:id', description: 'Delete movie content' },
    ],
  },
  {
    path: '/genres',
    envKey: 'MOVIE_SERVICE_URL',
    fallbackUrl: 'http://movie-service:3011',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List all genres' },
      { method: 'GET', path: '/:id', description: 'Get genre by ID' },
      { method: 'GET', path: '/slug/:slug', description: 'Get genre by slug' },
      { method: 'GET', path: '/:id/movies', description: 'Get movies by genre' },
      { method: 'POST', path: '/', description: 'Create genre (admin)' },
      { method: 'PUT', path: '/:id', description: 'Update genre (admin)' },
      { method: 'DELETE', path: '/:id', description: 'Delete genre (admin)' },
    ],
  },
  {
    path: '/sports',
    envKey: 'SPORTS_SERVICE_URL',
    fallbackUrl: 'http://sports-service:3021',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List sports content' },
      { method: 'GET', path: '/home', description: 'Sports home' },
      { method: 'GET', path: '/trending', description: 'Get trending sports' },
      { method: 'GET', path: '/categories', description: 'Sports categories' },
      { method: 'GET', path: '/live', description: 'Live sports' },
      { method: 'GET', path: '/live/scores', description: 'Live match scores' },
      { method: 'GET', path: '/live/match/:matchId', description: 'Live match details' },
      { method: 'GET', path: '/fixtures', description: 'Sports fixtures' },
      { method: 'GET', path: '/fixtures/:id', description: 'Fixture details' },
      { method: 'GET', path: '/upcoming', description: 'Upcoming fixtures' },
      { method: 'GET', path: '/highlights', description: 'Sports highlights' },
      { method: 'GET', path: '/predictions', description: 'Predictions' },
      { method: 'POST', path: '/predictions', description: 'Submit prediction' },
      { method: 'GET', path: '/prediction-leagues', description: 'Prediction leagues' },
      { method: 'GET', path: '/prediction-options', description: 'Prediction options' },
      { method: 'GET', path: '/score-options', description: 'Score options' },
      { method: 'GET', path: '/current-match', description: 'Current match' },
      { method: 'GET', path: '/leaderboard', description: 'Sports leaderboard' },
      { method: 'GET', path: '/fan-boards', description: 'Fan boards' },
      { method: 'GET', path: '/fan-contests', description: 'Fan contests' },
      { method: 'POST', path: '/fan-contests/:id/enter', description: 'Enter fan contest' },
      { method: 'GET', path: '/:id', description: 'Get sports content details' },
      { method: 'POST', path: '/', description: 'Create sports content' },
      { method: 'PATCH', path: '/:id', description: 'Update sports content' },
      { method: 'DELETE', path: '/:id', description: 'Delete sports content' },
    ],
  },
  {
    path: '/queue',
    envKey: 'QUEUE_SERVICE_URL',
    fallbackUrl: 'http://queue-service:3015',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get queue status' },
      { method: 'POST', path: '/enqueue', description: 'Enqueue a job' },
      { method: 'DELETE', path: '/:id', description: 'Cancel queued job' },
      { method: 'GET', path: '/:id/status', description: 'Get job status' },
      {
        method: 'GET',
        path: '/dlq-policy',
        description: 'Effective resolved DLQ retry policy per queue (admin)',
      },
      {
        method: 'POST',
        path: '/:queue/jobs/:jobId/retry-now',
        description:
          'Re-queue a permanently dead-lettered job with a fresh attempts budget (admin)',
      },
    ],
  },
  {
    path: '/lifestyle',
    envKey: 'LIFESTYLE_SERVICE_URL',
    fallbackUrl: 'http://lifestyle-service:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List lifestyle content' },
      { method: 'GET', path: '/trending', description: 'Get trending lifestyle' },
      { method: 'GET', path: '/featured', description: 'Get featured lifestyle' },
      { method: 'GET', path: '/categories', description: 'Lifestyle categories' },
      { method: 'GET', path: '/cities', description: 'Lifestyle cities' },
      { method: 'GET', path: '/creators', description: 'Lifestyle creators' },
      { method: 'GET', path: '/events', description: 'Lifestyle events' },
      { method: 'GET', path: '/events/:id', description: 'Event details' },
      { method: 'GET', path: '/music', description: 'Lifestyle music' },
      { method: 'GET', path: '/music/trending', description: 'Trending music' },
      { method: 'GET', path: '/music/genres', description: 'Music genres' },
      { method: 'GET', path: '/influencers', description: 'Lifestyle influencers' },
      { method: 'GET', path: '/influencers/:id', description: 'Influencer details' },
      { method: 'GET', path: '/celebrities', description: 'Lifestyle celebrities' },
      { method: 'GET', path: '/celebrities/:id', description: 'Celebrity details' },
      { method: 'GET', path: '/nightlife', description: 'Lifestyle nightlife' },
      { method: 'GET', path: '/saved', description: 'Saved lifestyle content' },
      { method: 'GET', path: '/:id', description: 'Get lifestyle content details' },
      { method: 'POST', path: '/', description: 'Create lifestyle content' },
      { method: 'PATCH', path: '/:id', description: 'Update lifestyle content' },
      { method: 'DELETE', path: '/:id', description: 'Delete lifestyle content' },
    ],
  },
  {
    path: '/vertical',
    envKey: 'VERTICAL_SERVICE_URL',
    fallbackUrl: 'http://vertical-service:3017',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    isNew: true,
    endpoints: [
      { method: 'GET', path: '/', description: 'List vertical content' },
      { method: 'GET', path: '/trending', description: 'Get trending vertical' },
      { method: 'GET', path: '/featured', description: 'Get featured vertical' },
      { method: 'GET', path: '/genres', description: 'Vertical genres' },
      { method: 'GET', path: '/characters', description: 'Vertical characters' },
      { method: 'GET', path: '/characters/:slug', description: 'Character details' },
      { method: 'GET', path: '/storyworlds', description: 'Vertical storyworlds' },
      { method: 'GET', path: '/storyworlds/:slug', description: 'Storyworld details' },
      { method: 'GET', path: '/crossovers', description: 'Vertical crossovers' },
      { method: 'GET', path: '/crossovers/:slug', description: 'Crossover details' },
      { method: 'GET', path: '/lore', description: 'Vertical lore' },
      { method: 'GET', path: '/lore/:slug', description: 'Lore details' },
      { method: 'GET', path: '/lore/categories', description: 'Lore categories' },
      { method: 'GET', path: '/timeline', description: 'Vertical timeline' },
      { method: 'GET', path: '/series', description: 'Vertical series' },
      { method: 'GET', path: '/:id', description: 'Get vertical content details' },
      { method: 'POST', path: '/', description: 'Create vertical content' },
      { method: 'PATCH', path: '/:id', description: 'Update vertical content' },
      { method: 'DELETE', path: '/:id', description: 'Delete vertical content' },
    ],
  },
  {
    path: '/live-events',
    envKey: 'LIVE_EVENT_SERVICE_URL',
    fallbackUrl: 'http://live-event-service:3027',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    isNew: true,
    endpoints: [
      { method: 'GET', path: '/', description: 'List upcoming/live events' },
      { method: 'GET', path: '/my-tickets', description: 'User ticket purchases' },
      { method: 'GET', path: '/:id', description: 'Get event details' },
      { method: 'GET', path: '/:id/stream', description: 'Get stream URL' },
      { method: 'POST', path: '/', description: 'Create event' },
      { method: 'POST', path: '/:id/purchase', description: 'Purchase ticket' },
      { method: 'PUT', path: '/:id', description: 'Update event' },
      { method: 'DELETE', path: '/:id/cancel', description: 'Cancel event' },
    ],
  },
  {
    path: '/challenges',
    envKey: 'CREATOR_SERVICE_URL',
    fallbackUrl: 'http://creator-service:3018',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List challenges' },
      { method: 'POST', path: '/', description: 'Create challenge' },
      {
        method: 'POST',
        path: '/:challengeId/participate',
        description: 'Participate in challenge',
      },
    ],
  },
];
@ApiTags('Gateway')
@Controller('api')
@UseGuards(AuthThrottlerGuard)
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);
  private readonly REQUEST_ID_HEADER = 'X-Request-ID';
  private readonly UPSTREAM_TIMEOUT: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(CircuitBreakerProxyService)
    private circuitBreakerProxyService: CircuitBreakerProxyService,
    @Inject(FeatureFlagService)
    private readonly featureFlagService: FeatureFlagService
  ) {
    this.UPSTREAM_TIMEOUT = this.configService.get<number>('UPSTREAM_TIMEOUT', 30000);
  }

  // ─── Versioned routes with path: /api/:version/:service/*path ──────

  @Get(':version/:service/*path')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedGet(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy(
      'GET',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Post(':version/:service/*path')
  @HttpCode(HttpStatus.CREATED)
  async proxyVersionedPost(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy(
      'POST',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Put(':version/:service/*path')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedPut(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy(
      'PUT',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Patch(':version/:service/*path')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedPatch(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy(
      'PATCH',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Delete(':version/:service/*path')
  @HttpCode(HttpStatus.NO_CONTENT)
  async proxyVersionedDelete(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy(
      'DELETE',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  // ─── Versioned routes without path: /api/:version/:service ─────────

  @Get(':version/:service')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedRootGet(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy('GET', version, service, '', req, res);
  }

  @Post(':version/:service')
  @HttpCode(HttpStatus.CREATED)
  async proxyVersionedRootPost(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy('POST', version, service, '', req, res);
  }

  @Put(':version/:service')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedRootPut(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy('PUT', version, service, '', req, res);
  }

  @Patch(':version/:service')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedRootPatch(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy('PATCH', version, service, '', req, res);
  }

  @Delete(':version/:service')
  @HttpCode(HttpStatus.NO_CONTENT)
  async proxyVersionedRootDelete(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    return this.handleProxy('DELETE', version, service, '', req, res);
  }

  // ─── Legacy unversioned routes: /api/:service/*path ────────────────

  @Get(':service/*path')
  @HttpCode(HttpStatus.OK)
  async proxyGet(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const version = await this.resolveVersionFromHeader(req);
    return this.handleProxy(
      'GET',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Post(':service/*path')
  @HttpCode(HttpStatus.CREATED)
  async proxyPost(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const version = await this.resolveVersionFromHeader(req);
    return this.handleProxy(
      'POST',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Put(':service/*path')
  @HttpCode(HttpStatus.OK)
  async proxyPut(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const version = await this.resolveVersionFromHeader(req);
    return this.handleProxy(
      'PUT',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Patch(':service/*path')
  @HttpCode(HttpStatus.OK)
  async proxyPatch(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const version = await this.resolveVersionFromHeader(req);
    return this.handleProxy(
      'PATCH',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  @Delete(':service/*path')
  @HttpCode(HttpStatus.NO_CONTENT)
  async proxyDelete(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const version = await this.resolveVersionFromHeader(req);
    return this.handleProxy(
      'DELETE',
      version,
      service,
      (req.params['path'] as string) || '',
      req,
      res
    );
  }

  // ─── Unified proxy handler ─────────────────────────────────────────

  /**
   * Resolve API version from the request header (for legacy unversioned routes).
   * Validates against the route's supported versions; falls back to default.
   */
  private async resolveVersionFromHeader(req: Request): Promise<string> {
    const headerValue = req.headers[API_VERSION_HEADER.toLowerCase()];
    const version = ApiVersioningConfig.parseVersion(
      Array.isArray(headerValue) ? headerValue[0] : headerValue || ''
    );
    const serviceParam = req.params['service'];
    const service = Array.isArray(serviceParam) ? serviceParam[0] : serviceParam || '';
    const route = await this.findRoute(service);
    if (route && this.validateVersion(version, route)) {
      return version;
    }
    return route?.defaultVersion || version;
  }

  /**
   * Single entry point for all proxy requests. Resolves version, validates, and forwards.
   */
  private async handleProxy(
    method: string,
    version: string,
    service: string,
    path: string,
    req: Request,
    res: Response
  ): Promise<void> {
    return this.proxyRequest(method, version, service, path, req, res);
  }

  @Get('routes')
  @UseGuards(AdminGuard)
  @Header('Content-Type', 'application/json')
  getRoutes(): {
    success: boolean;
    data: {
      path: string;
      targetUrl: string;
      supportedVersions: string[];
      defaultVersion: string;
    }[];
  } {
    return {
      success: true,
      data: SERVICE_CONFIGS.map((r) => ({
        path: r.path,
        targetUrl: this.configService.get<string>(r.envKey) || r.fallbackUrl,
        supportedVersions: r.supportedVersions,
        defaultVersion: r.defaultVersion,
        pathStrategy: r.pathStrategy,
      })),
    };
  }

  private async findRoute(service: string): Promise<ServiceRoute | undefined> {
    const config = SERVICE_CONFIGS.find(
      (r) => r.path === `/${service}` || r.path.startsWith(`/${service}/`)
    );
    if (!config) {
      return undefined;
    }

    // New routes (gateway_new_routes, default off): 404 until ops enables them.
    if (config.isNew) {
      const newRoutesEnabled = await this.featureFlagService.isEnabled(gatewayFlags.newRoutes);
      if (!newRoutesEnabled) {
        return undefined;
      }
    }

    return {
      ...config,
      targetUrl: this.configService.get<string>(config.envKey) || config.fallbackUrl,
      pathStrategy: config.pathStrategy || 'default',
      pathRewrite: config.pathRewrite,
    };
  }

  private validateVersion(version: string, route: ServiceRoute): boolean {
    // Strip 'v' prefix from version (e.g., 'v1' -> '1')
    const normalizedVersion = version.startsWith('v') ? version.substring(1) : version;
    if (!/^\d+$/.test(normalizedVersion)) {
      return false;
    }
    return route.supportedVersions.includes(normalizedVersion);
  }

  private buildCacheKey(req: Request, version: string): string {
    const authHeader = req.headers.authorization || '';
    const userId = this.extractUserIdFromAuth(authHeader);
    const normalizedVersion = version.startsWith('v') ? version.substring(1) : version;

    const urlObj = new URL(req.url, 'http://localhost');
    const sortedParams = [...urlObj.searchParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const normalizedUrl = sortedParams ? `${urlObj.pathname}?${sortedParams}` : urlObj.pathname;

    const cacheKeyBase = `proxy:${req.method}:${normalizedUrl}:v${normalizedVersion}`;

    if (userId && this.isUserSpecificEndpoint(req.path)) {
      return `${cacheKeyBase}:user:${userId}`;
    }

    return cacheKeyBase;
  }

  /**
   * Extract a stable cache key from the JWT header FOR CACHE PARTITIONING ONLY.
   * WARNING: This does NOT decode or verify the JWT signature. Do NOT use for authorization.
   * Authentication is handled by upstream services via GatewayAuthGuard.
   * We use a SHA-256 hash of the token to avoid exposing unverified claims and to prevent
   * cache poisoning via forged tokens (an attacker would need the signing key to produce
   * a hash that collides with a legitimate user's token hash).
   */
  private extractUserIdFromAuth(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.substring(7);
      return createHash('sha256').update(token).digest('hex');
    } catch {
      // Gracefully fail without leaking errors - just don't use cache partitioning
      return null;
    }
  }

  private isUserSpecificEndpoint(path: string): boolean {
    const userSpecificPatterns = [
      '/wallet/',
      '/notifications',
      '/rewards',
      '/creator/',
      '/users/',
      '/recommendations/',
      '/recommendation/',
    ];
    return userSpecificPatterns.some((pattern) => path.includes(pattern));
  }

  private async proxyRequest(
    method: string,
    version: string,
    service: string,
    _path: string,
    req: Request,
    res: Response
  ): Promise<void> {
    let requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();
    if (requestId && !/^[a-zA-Z0-9\-]{1,128}$/.test(requestId)) {
      requestId = randomUUID();
    }

    // Global kill-switch: gateway_maintenance_mode returns 503 for all traffic.
    const [maintenanceMode, apiV2Enabled, responseCacheEnabled] = await Promise.all([
      this.featureFlagService.isEnabled(gatewayFlags.maintenanceMode),
      this.featureFlagService.isEnabled(gatewayFlags.apiV2),
      this.featureFlagService.isEnabled(gatewayFlags.responseCache),
    ]);
    if (maintenanceMode) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.setHeader('Retry-After', '300');
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: 'Platform is under maintenance. Please try again later.',
      });
      return;
    }

    const route = await this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    // API v2 is gated behind gateway_api_v2 — newer versions are only reachable
    // once the flag is enabled (routes may list them in supportedVersions).
    const normalizedVersion = version.startsWith('v') ? version.substring(1) : version;
    if (normalizedVersion !== '1' && !apiV2Enabled) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({
        message: `API version ${version} is not enabled`,
        supportedVersions: route.supportedVersions,
        defaultVersion: route.defaultVersion,
      });
      return;
    }

    if (!this.validateVersion(version, route)) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({
        message: `API version ${version} not supported for this service`,
        supportedVersions: route.supportedVersions,
        defaultVersion: route.defaultVersion,
      });
      return;
    }

    const cacheKey = this.buildCacheKey(req, version);

    if (method === 'GET' && responseCacheEnabled) {
      const cachedResponse = await this.cacheManager.get(cacheKey);
      if (cachedResponse) {
        res.setHeader(API_VERSION_HEADER, version);
        res.setHeader(this.REQUEST_ID_HEADER, requestId);
        res.json(cachedResponse);
        return;
      }
    }

    res.setHeader(API_VERSION_HEADER, version);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    const response = await this.forwardRequest(
      req,
      res,
      route.targetUrl,
      version,
      requestId,
      route
    );
    // forwardRequest() returns the parsed body for JSON GET responses but does
    // NOT write it to `res` (it only writes text/stream bodies). Deliver it to
    // the client here — and cache it for subsequent requests. Regression: a
    // refactor dropped the old `res.json(response)` call, so the first GET to
    // any endpoint returned an empty body (or hung) and only cached repeats
    // within the 5-minute TTL succeeded.
    if (method === 'GET' && response && typeof response === 'object' && !res.headersSent) {
      if (responseCacheEnabled) {
        await this.cacheManager.set(cacheKey, response, CACHE_TTL_MS);
      }
      res.json(response);
    }
  }

  private async forwardRequest(
    req: Request,
    res: Response,
    targetUrl: string,
    version: string = DEFAULT_API_VERSION,
    requestId: string,
    route: ServiceRoute
  ): Promise<unknown> {
    const serviceParam = req.params['service'];
    const service = Array.isArray(serviceParam) ? serviceParam[0] : serviceParam || '';

    // Admin role check BEFORE any upstream communication (SEC: fail-fast authorization)
    if (service === 'admin') {
      const reqWithUser = req as Request & { user?: { role?: string } };
      const user = reqWithUser.user;
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        this.logger.warn(`Admin access denied for request [${requestId}]`);
        res.status(HttpStatus.FORBIDDEN).json({ message: 'Admin access required' });
        return null;
      }
    }

    const rawPathParam = req.params['path'] || req.params[0] || '';
    const rawPath = Array.isArray(rawPathParam) ? rawPathParam.join('/') : rawPathParam;
    // Strip query string from path (captured by *path wildcard)
    const cleanPath = rawPath.split('?')[0];
    const path = cleanPath ? `/${cleanPath}` : '';
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';

    // Normalize version: strip 'v' prefix (e.g., 'v1' -> '1')
    const normalizedVersion = version.startsWith('v') ? version.substring(1) : version;

    let targetPath: string;
    switch (route.pathStrategy) {
      case 'auth-service-strategy':
        // Auth service has /v{version} as global prefix, and controllers are at /auth, /health, etc.
        if (path.startsWith('/health') || path.startsWith('/live') || path.startsWith('/ready')) {
          targetPath = `/v${normalizedVersion}${path}${queryString ? `?${queryString}` : ''}`;
        } else {
          targetPath = `/v${normalizedVersion}/${service}${path}${queryString ? `?${queryString}` : ''}`;
        }
        break;
      case 'includes-prefix':
        // Service already has /v{version}/{service} as global prefix
        targetPath = `/v${normalizedVersion}/${service}${path}${queryString ? `?${queryString}` : ''}`;
        break;
      case 'no-prefix':
        // Service has no global prefix, just use /{service}{path}
        targetPath = `/${service}${path}${queryString ? `?${queryString}` : ''}`;
        break;
      case 'default':
      default:
        // Default strategy: /v{version}/{service}{path}
        targetPath = `/v${normalizedVersion}/${service}${path}${queryString ? `?${queryString}` : ''}`;
        break;
    }

    // Apply pathRewrite if configured (strip prefix like '/v1' for services without version prefix)
    if (route.pathRewrite) {
      for (const [pattern, replacement] of Object.entries(route.pathRewrite)) {
        targetPath = targetPath.replace(new RegExp(pattern), replacement);
      }
    }

    this.logger.log(`Forwarding ${req.method} ${targetPath} to ${targetUrl} [${requestId}]`);

    try {
      const headers: Record<string, string> = {};
      headers[API_VERSION_HEADER] = version;
      headers[this.REQUEST_ID_HEADER] = requestId;

      const ALLOWED_HEADERS = [
        'content-type',
        'accept',
        'accept-language',
        'accept-encoding',
        'authorization',
        'x-request-id',
        'x-correlation-id',
      ];

      for (const key of ALLOWED_HEADERS) {
        const value = req.headers[key];
        if (typeof value === 'string') {
          headers[key] = value;
        }
      }

      // Inject gateway secret so downstream ServiceAuthGuard trusts x-user-* headers
      const gatewaySecret = this.configService.get<string>('GATEWAY_SECRET');
      if (gatewaySecret) {
        headers['x-gateway-secret'] = gatewaySecret;
      }

      const cleanTargetPath = targetPath.split('?')[0];

      const proxyResponse = await this.circuitBreakerProxyService.proxyRequest({
        method: req.method,
        targetUrl,
        path: cleanTargetPath,
        headers,
        body: req.body,
        queryString: queryString || undefined,
        timeout: this.UPSTREAM_TIMEOUT,
        requestId,
      });

      const skipHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'content-encoding'];

      for (const [key, value] of Object.entries(proxyResponse.headers)) {
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      }
      res.setHeader(API_VERSION_HEADER, version);
      res.setHeader(this.REQUEST_ID_HEADER, requestId);

      const statusToForward = [200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503];
      if (statusToForward.includes(proxyResponse.status)) {
        res.status(proxyResponse.status);
      } else {
        res.status(HttpStatus.OK);
      }

      const data = proxyResponse.data;

      if (typeof data === 'string') {
        res.send(data);
        return null;
      } else if (data instanceof ArrayBuffer) {
        res.send(Buffer.from(data));
        return null;
      } else if (data instanceof Uint8Array) {
        res.send(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
        return null;
      } else {
        if (req.method === 'GET') {
          return data;
        }
        res.json(data);
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Failed to forward request to ${targetUrl}${targetPath} [${requestId}]: ${(error as Error).message}`
      );
      if (!res.headersSent) {
        res.setHeader(this.REQUEST_ID_HEADER, requestId);
        res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Failed to reach upstream service',
          requestId,
          ...(process.env.NODE_ENV === 'production'
            ? {}
            : { error: error instanceof Error ? (error as Error).message : 'Unknown error' }),
        });
      }
      return null;
    }
  }
}
