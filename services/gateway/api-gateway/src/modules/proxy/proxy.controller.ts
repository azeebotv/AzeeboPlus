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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { ApiVersioningConfig, API_VERSION_HEADER, DEFAULT_API_VERSION } from '@azeebo/shared-types';
import { randomUUID } from 'crypto';

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
}

interface ServiceRoute {
  path: string;
  targetUrl: string;
  supportedVersions: string[];
  defaultVersion: string;
  endpoints?: Endpoint[];
  pathStrategy?: 'default' | 'includes-prefix' | 'no-prefix' | 'auth-service-strategy';
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
      { method: 'DELETE', path: '/logout', description: 'Logout (invalidate tokens)' },
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
      { method: 'GET', path: '/social/google/authorize', description: 'Initiate Google OAuth flow with state' },
      { method: 'POST', path: '/social/apple', description: 'Apple OAuth login (legacy)' },
      { method: 'GET', path: '/social/apple/authorize', description: 'Initiate Apple OAuth flow with state' },
      { method: 'POST', path: '/social/callback', description: 'OAuth callback with state validation' },
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
      { method: 'GET', path: '/:id', description: 'Get user by ID' },
      { method: 'GET', path: '/:id/content', description: "Get user's content" },
      { method: 'POST', path: '/:id/follow', description: 'Follow a user' },
      { method: 'DELETE', path: '/:id/follow', description: 'Unfollow a user' },
      { method: 'GET', path: '/:id/followers', description: "Get user's followers" },
      { method: 'GET', path: '/:id/following', description: 'Get users being followed' },
    ],
  },
  {
    path: '/wallet',
    envKey: 'WALLET_SERVICE_URL',
    fallbackUrl: 'http://wallet-service:3002',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: "Get current user's wallet" },
      { method: 'GET', path: '/transactions', description: 'Get transaction history' },
      { method: 'GET', path: '/summary', description: 'Get wallet summary' },
      { method: 'POST', path: '/fund', description: 'Fund wallet' },
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
    path: '/content',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    endpoints: [
      { method: 'GET', path: '/', description: 'List content (with filters)' },
      { method: 'GET', path: '/home', description: 'Get home feed' },
      { method: 'GET', path: '/watch', description: 'Get watch hub feed' },
      { method: 'GET', path: '/search', description: 'Search content' },
      { method: 'GET', path: '/trending', description: 'Get trending content' },
      { method: 'GET', path: '/featured', description: 'Get featured content' },
      { method: 'GET', path: '/accessible', description: 'Get accessible content for user' },
      { method: 'GET', path: '/recommended', description: 'Get recommended content' },
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
      { method: 'POST', path: '/tips/:creatorId', description: 'Send tip to creator' },
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
    pathStrategy: 'no-prefix',
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
      { method: 'DELETE', path: '/conversations/:id', description: 'Delete conversation' },
    ],
  },
  {
    path: '/referrals',
    envKey: 'REFERRAL_SERVICE_URL',
    fallbackUrl: 'http://referral-service:3025',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
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
      { method: 'POST', path: '/subscribe', description: 'Subscribe to a plan' },
      { method: 'GET', path: '/current', description: 'Get current subscription' },
      { method: 'DELETE', path: '/:id', description: 'Cancel subscription' },
      { method: 'GET', path: '/history', description: 'Get subscription history' },
    ],
  },
  {
    path: '/media',
    envKey: 'MEDIA_SERVICE_URL',
    fallbackUrl: 'http://media-service:3019',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    endpoints: [
      { method: 'POST', path: '/upload/image', description: 'Upload image' },
      { method: 'POST', path: '/upload/video', description: 'Upload video' },
      { method: 'POST', path: '/upload/avatar', description: 'Upload avatar' },
      { method: 'GET', path: '/presigned/upload', description: 'Get presigned upload URL' },
      { method: 'GET', path: '/presigned/download', description: 'Get presigned download URL' },
      { method: 'GET', path: '/metadata', description: 'Get file metadata' },
      { method: 'DELETE', path: '/:key', description: 'Delete file' },
    ],
  },
  {
    path: '/universe',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    endpoints: [{ method: 'GET', path: '/', description: 'Get all universes' }],
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
    path: '/movie',
    envKey: 'MOVIE_SERVICE_URL',
    fallbackUrl: 'http://movie-service:3011',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List movies' },
      { method: 'GET', path: '/trending', description: 'Get trending movies' },
      { method: 'GET', path: '/:id', description: 'Get movie details' },
      { method: 'POST', path: '/', description: 'Create movie content' },
      { method: 'PATCH', path: '/:id', description: 'Update movie content' },
      { method: 'DELETE', path: '/:id', description: 'Delete movie content' },
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
      { method: 'GET', path: '/trending', description: 'Get trending sports' },
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
    endpoints: [
      { method: 'GET', path: '/', description: 'List vertical content' },
      { method: 'GET', path: '/trending', description: 'Get trending vertical' },
      { method: 'GET', path: '/:id', description: 'Get vertical content details' },
      { method: 'POST', path: '/', description: 'Create vertical content' },
      { method: 'PATCH', path: '/:id', description: 'Update vertical content' },
      { method: 'DELETE', path: '/:id', description: 'Delete vertical content' },
    ],
  },
];

@Controller('api')
@UseGuards(ThrottlerGuard)
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);
  private readonly REQUEST_ID_HEADER = 'X-Request-ID';
  private readonly UPSTREAM_TIMEOUT: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService
  ) {
    this.UPSTREAM_TIMEOUT = this.configService.get<number>('UPSTREAM_TIMEOUT', 30000);
  }

  @Get(':version/:service/*')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedGet(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
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
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      res.setHeader(API_VERSION_HEADER, version);
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.json(cachedResponse);
      return;
    }

    const response = await this.forwardRequest(
      req,
      res,
      route.targetUrl,
      version,
      requestId,
      route
    );
    if (response && typeof response === 'object') {
      await this.cacheManager.set(cacheKey, response, 300000);
      res.setHeader(API_VERSION_HEADER, version);
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.json(response);
    }
  }

  @Post(':version/:service/*')
  @HttpCode(HttpStatus.CREATED)
  async proxyVersionedPost(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
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

    res.setHeader(API_VERSION_HEADER, version);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, version, requestId, route);
  }

  @Put(':version/:service/*')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedPut(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
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

    res.setHeader(API_VERSION_HEADER, version);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, version, requestId, route);
  }

  @Patch(':version/:service/*')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedPatch(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
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

    res.setHeader(API_VERSION_HEADER, version);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, version, requestId, route);
  }

  @Delete(':version/:service/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async proxyVersionedDelete(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
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

    res.setHeader(API_VERSION_HEADER, version);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, version, requestId, route);
  }

  @Get(':service/*')
  @HttpCode(HttpStatus.OK)
  async proxyGet(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(
      req.headers[API_VERSION_HEADER.toLowerCase()] as string
    );
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    const cacheKey = this.buildCacheKey(req, validatedVersion);
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      res.setHeader(API_VERSION_HEADER, validatedVersion);
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.json(cachedResponse);
      return;
    }

    const response = await this.forwardRequest(
      req,
      res,
      route.targetUrl,
      validatedVersion,
      requestId,
      route
    );
    if (response && typeof response === 'object') {
      await this.cacheManager.set(cacheKey, response, 300000);
      res.setHeader(API_VERSION_HEADER, validatedVersion);
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.json(response);
    }
  }

  @Post(':service/*')
  @HttpCode(HttpStatus.CREATED)
  async proxyPost(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(
      req.headers[API_VERSION_HEADER.toLowerCase()] as string
    );
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId, route);
  }

  @Put(':service/*')
  @HttpCode(HttpStatus.OK)
  async proxyPut(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(
      req.headers[API_VERSION_HEADER.toLowerCase()] as string
    );
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId, route);
  }

  @Patch(':service/*')
  @HttpCode(HttpStatus.OK)
  async proxyPatch(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(
      req.headers[API_VERSION_HEADER.toLowerCase()] as string
    );
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId, route);
  }

  @Delete(':service/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async proxyDelete(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

    const route = this.findRoute(service);
    if (!route) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(
      req.headers[API_VERSION_HEADER.toLowerCase()] as string
    );
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    res.setHeader(this.REQUEST_ID_HEADER, requestId);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId, route);
  }

  @Get('routes')
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

  private findRoute(service: string): ServiceRoute | undefined {
    const config = SERVICE_CONFIGS.find(
      (r) => r.path === `/${service}` || r.path.startsWith(`/${service}/`)
    );
    if (!config) return undefined;
    return {
      ...config,
      targetUrl: this.configService.get<string>(config.envKey) || config.fallbackUrl,
      pathStrategy: config.pathStrategy || 'default',
    };
  }

  private validateVersion(version: string, route: ServiceRoute): boolean {
    return route.supportedVersions.includes(version);
  }

  private buildCacheKey(req: Request, version: string): string {
    const authHeader = req.headers.authorization || '';
    const userId = this.extractUserIdFromAuth(authHeader);
    const cacheKeyBase = `proxy:${req.method}:${req.url}:v${version}`;

    if (userId && this.isUserSpecificEndpoint(req.path)) {
      return `${cacheKeyBase}:user:${userId}`;
    }

    return cacheKeyBase;
  }

  /**
   * Extract user ID from JWT header FOR CACHE PARTITIONING ONLY.
   * THIS DOES NOT PERFORM JWT VERIFICATION - authentication is handled by upstream services.
   * We only use this for cache keying to separate cached responses between users.
   */
  private extractUserIdFromAuth(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.substring(7);
      const tokenParts = token.split('.');

      // JWT must have exactly 3 parts
      if (tokenParts.length !== 3) {
        return null;
      }

      // Base64 decode the payload (second part)
      const payloadBase64 = tokenParts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson);

      // Extract user ID from common claims
      return payload.sub || payload.userId || payload.id || null;
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

  private async forwardRequest(
    req: Request,
    res: Response,
    targetUrl: string,
    version: string = DEFAULT_API_VERSION,
    requestId: string,
    route: ServiceRoute
  ): Promise<unknown> {
    const service = req.params['service'];
    const path = req.params[0] ? `/${req.params[0]}` : '';
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';

    let targetPath: string;
    switch (route.pathStrategy) {
      case 'auth-service-strategy':
        // Auth service has /v{version} as global prefix, and controllers are at /auth, /health, etc.
        if (path.startsWith('/health') || path.startsWith('/live') || path.startsWith('/ready')) {
          targetPath = `/v${version}${path}${queryString ? `?${queryString}` : ''}`;
        } else {
          targetPath = `/v${version}/${service}${path}${queryString ? `?${queryString}` : ''}`;
        }
        break;
      case 'includes-prefix':
        // Service already has /v{version}/{service} as global prefix
        targetPath = `/v${version}/${service}${path}${queryString ? `?${queryString}` : ''}`;
        break;
      case 'no-prefix':
        // Service has no global prefix, just use /{service}{path}
        targetPath = `/${service}${path}${queryString ? `?${queryString}` : ''}`;
        break;
      case 'default':
      default:
        // Default strategy: /v{version}/{service}{path}
        targetPath = `/v${version}/${service}${path}${queryString ? `?${queryString}` : ''}`;
        break;
    }

    const target = `${targetUrl}${targetPath}`;
    this.logger.log(`Forwarding request to ${target}`);

    try {
      const headers: Record<string, string> = {};
      headers[API_VERSION_HEADER] = version;
      headers[this.REQUEST_ID_HEADER] = requestId;

      const skipHeaders = [
        'host',
        'connection',
        'content-length',
        API_VERSION_HEADER.toLowerCase(),
        this.REQUEST_ID_HEADER.toLowerCase(),
      ];

      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string' && !skipHeaders.includes(key.toLowerCase())) {
          headers[key] = value;
        }
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
        signal: AbortSignal.timeout(this.UPSTREAM_TIMEOUT),
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(target, fetchOptions);

      for (const [key, value] of response.headers.entries()) {
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      }
      res.setHeader(API_VERSION_HEADER, version);
      res.setHeader(this.REQUEST_ID_HEADER, requestId);

      const statusToForward = [200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503];
      if (statusToForward.includes(response.status)) {
        res.status(response.status);
      } else {
        res.status(HttpStatus.OK);
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (req.method === 'GET') {
          return data;
        }
        res.json(data);
        return data;
      } else if (contentType && contentType.includes('text/')) {
        const text = await response.text();
        res.send(text);
        return null;
      } else {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Failed to forward request to ${target} [${requestId}]: ${(error as Error).message}`
      );
      if (!res.headersSent) {
        res.setHeader(this.REQUEST_ID_HEADER, requestId);
        res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Failed to reach upstream service',
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return null;
    }
  }
}
