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
import { Request, Response } from 'express';
import { RawBodyRequest } from '../../common/raw-body-capture.middleware';
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
  /**
   * Explicit opt-in to the gateway GET response cache. The cache is
   * deny-by-default: only routes marked publicCacheable are eligible, and
   * even those are never cached for authenticated callers (see
   * isAuthenticatedRequest) — a shared cached body must never be able to
   * serve one user another user's data, and per-user queries must never
   * read stale bytes after a mutation.
   */
  publicCacheable?: boolean;
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
  publicCacheable?: boolean;
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
      { method: 'GET', path: '/mfa/setup', description: 'Get MFA setup details' },
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
      { method: 'POST', path: '/cookie', description: 'Set auth tokens as httpOnly cookies' },
      { method: 'DELETE', path: '/cookie', description: 'Clear auth cookies' },
      { method: 'GET', path: '/csrf', description: 'Get CSRF token' },
      // ---- Undeclared-surface ratchet pass (devices, magic link, MFA, social, OTP) ----
      {
        method: 'POST',
        path: '/devices/register',
        description: 'Register a trusted device',
      },
      { method: 'GET', path: '/devices/check', description: 'Check device trust status' },
      {
        method: 'POST',
        path: '/device/link/info',
        description: 'Device link request info',
      },
      {
        method: 'POST',
        path: '/device/link',
        description: 'Request a device link',
      },
      {
        method: 'POST',
        path: '/device/link/confirm',
        description: 'Confirm a device link',
      },
      {
        method: 'POST',
        path: '/device/link/deny',
        description: 'Deny a device link',
      },
      {
        method: 'POST',
        path: '/device/link/poll',
        description: 'Poll a device link status',
      },
      {
        method: 'POST',
        path: '/magic-link/request',
        description: 'Request a magic login link',
      },
      {
        method: 'POST',
        path: '/magic-link/verify',
        description: 'Verify a magic login link',
      },
      {
        method: 'POST',
        path: '/mfa/verify-login',
        description: 'Verify MFA during login',
      },
      { method: 'POST', path: '/social/login', description: 'Social provider login' },
      { method: 'GET', path: '/social/accounts', description: 'Linked social accounts' },
      { method: 'POST', path: '/request-otp', description: 'Request an OTP' },
      { method: 'POST', path: '/verify-otp', description: 'Verify an OTP' },
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
      { method: 'PUT', path: '/me/preferences', description: 'Update user preferences' },
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
      { method: 'POST', path: '/:id/follow', description: 'Follow a user' },
      { method: 'DELETE', path: '/:id/follow', description: 'Unfollow a user' },
      { method: 'GET', path: '/:id/followers', description: "Get user's followers" },
      { method: 'GET', path: '/:id/following', description: 'Get users being followed' },
      // ---- Undeclared-surface ratchet pass (avatar) ----
      {
        method: 'GET',
        path: '/me/avatar/upload-url',
        description: 'Get presigned avatar upload URL',
      },
      { method: 'POST', path: '/me/avatar', description: 'Set avatar after upload' },
      { method: 'DELETE', path: '/me/avatar', description: 'Remove avatar' },
    ],
  },
  {
    path: '/privacy',
    envKey: 'USER_SERVICE_URL',
    // AUD-04 fix: 3002 is wallet-service; user-service listens on 3001
    // (same envKey as /users and /interactions, which both resolve 3001).
    fallbackUrl: 'http://user-service:3001',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      // user-deletion.controller @Controller('privacy')
      { method: 'POST', path: '/deletion-request', description: 'Request account deletion' },
      {
        method: 'GET',
        path: '/deletion-status/:userId',
        description: 'Deletion request status',
      },
      {
        method: 'GET',
        path: '/data/:userId/export',
        description: 'Export user data (GDPR)',
      },
      { method: 'DELETE', path: '/data/:userId', description: 'Erase user data (admin)' },
    ],
  },
  {
    path: '/interactions',
    envKey: 'USER_SERVICE_URL',
    fallbackUrl: 'http://user-service:3001',
    supportedVersions: ['1'],
    defaultVersion: '1',
    // user-service uses URI versioning (/v1/interactions/...) — the default
    // strategy; 'no-prefix' here used to forward to /interactions/*, which no
    // controller serves (404 on every watchlist/history/favorites call).
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
    pathStrategy: 'default',
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
      { method: 'POST', path: '/fund', description: 'Fund the wallet (add funds)' },
      { method: 'POST', path: '/redeem-reward', description: 'Redeem reward points' },
      { method: 'POST', path: '/bonus-credit', description: 'Add bonus credit' },
      { method: 'POST', path: '/promo-credit', description: 'Add promo credit' },
      { method: 'GET', path: '/audit-trail', description: 'Get audit trail' },
      { method: 'POST', path: '/debit', description: 'Debit wallet' },
      { method: 'POST', path: '/credit', description: 'Credit wallet' },
      { method: 'POST', path: '/withdraw', description: 'Withdraw funds' },
      { method: 'POST', path: '/transfer', description: 'Transfer to another user' },
      { method: 'GET', path: '/transactions/:id', description: 'Get transaction details' },
      // ---- Undeclared-surface ratchet pass ----
      { method: 'POST', path: '/charge', description: 'Charge a wallet (one-off)' },
      {
        method: 'POST',
        path: '/credit-reverse',
        description: 'Reverse a wallet credit',
      },
    ],
  },
  {
    path: '/borrow',
    envKey: 'WALLET_SERVICE_URL',
    fallbackUrl: 'http://wallet-service:3002',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    // Deliberately NOT publicCacheable: this catalogue names lenders Azeebo+ has
    // approved, so a partner that is pulled or deactivated must disappear from the
    // public page on the next request. The gateway cache holds a body for
    // CACHE_TTL_MS with no write-side invalidation, which would keep advertising a
    // removed partner (and its dead apply link) for minutes after the admin edit.
    // The listing is a single indexed read of a few dozen rows, so the cache bought
    // almost nothing. /admin/* rows are uncacheable anyway (isAdminPath).
    endpoints: [
      { method: 'GET', path: '/banks', description: 'List active lending partners' },
      { method: 'GET', path: '/banks/:slug', description: 'Get one lending partner' },
      { method: 'GET', path: '/admin/banks', description: 'List all partners incl. inactive (admin)' },
      { method: 'POST', path: '/admin/banks', description: 'Create a partner (admin)' },
      { method: 'PATCH', path: '/admin/banks/:id', description: 'Update a partner (admin)' },
      { method: 'DELETE', path: '/admin/banks/:id', description: 'Delete a partner (admin)' },
    ],
  },
  {
    path: '/pricing',
    envKey: 'PAYMENT_SERVICE_URL',
    fallbackUrl: 'http://payment-service:3003',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    // Anonymous pricing tables — the canonical cacheable surface.
    publicCacheable: true,
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
      // ---- Undeclared-surface ratchet pass ----
      {
        method: 'POST',
        path: '/intent/:id/confirm',
        description: 'Confirm a payment intent',
      },
    ],
  },
  {
    path: '/public',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    // Anonymous-only public content settings/universes — the canonical
    // cacheable surface.
    publicCacheable: true,
    endpoints: [
      { method: 'GET', path: '/settings', description: 'Get public settings' },
      { method: 'GET', path: '/settings/:key', description: 'Get a public setting' },
      { method: 'GET', path: '/universes', description: 'Get enabled universes' },
      {
        method: 'GET',
        path: '/universes/:name/features',
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
      // Direct-to-storage upload flow (web creators/upload page)
      {
        method: 'POST',
        path: '/:id/media/upload-url',
        description: 'Get a presigned upload URL for content media',
      },
      {
        method: 'POST',
        path: '/:id/media/complete',
        description: 'Complete a direct upload and register the media asset',
      },
      { method: 'GET', path: '/:id/related', description: 'Get related content' },
      { method: 'POST', path: '/:id/report', description: 'Report content' },
      { method: 'GET', path: '/:id/access-check', description: 'Check content access' },
      { method: 'GET', path: '/:id/playback-url', description: 'Get playback URL' },
      { method: 'GET', path: '/categories', description: 'Get all categories' },
      { method: 'GET', path: '/tags', description: 'Get all tags' },
      // ---- Undeclared-surface ratchet pass (content admin/tooling) ----
      {
        method: 'POST',
        path: '/:id/media/thumbnail',
        description: 'Replace content thumbnail media',
      },
      { method: 'PATCH', path: '/:id/media', description: 'Update content media references' },
      { method: 'DELETE', path: '/:id/media', description: 'Remove content media' },
      { method: 'POST', path: '/:id/relationships', description: 'Relate content to content' },
      {
        method: 'DELETE',
        path: '/:id/relationships/:relatedContentId',
        description: 'Remove content relationship',
      },
      { method: 'POST', path: '/:id/tags/:tagId', description: 'Attach tag to content' },
      { method: 'DELETE', path: '/:id/tags/:tagId', description: 'Detach tag from content' },
      {
        method: 'POST',
        path: '/:id/categories/:categoryId',
        description: 'Attach category to content',
      },
      {
        method: 'DELETE',
        path: '/:id/categories/:categoryId',
        description: 'Detach category from content',
      },
      { method: 'POST', path: '/:id/versions', description: 'Snapshot content version' },
      {
        method: 'GET',
        path: '/:id/versions/:versionNumber',
        description: 'Get content version snapshot',
      },
      {
        method: 'GET',
        path: '/:id/versions/compare',
        description: 'Compare content versions (query: a, b)',
      },
      {
        method: 'POST',
        path: '/:id/versions/:versionNumber/rollback',
        description: 'Roll back content to a version',
      },
      { method: 'POST', path: '/:id/transcode', description: 'Queue a transcode job' },
      {
        method: 'GET',
        path: '/:id/transcode/:jobId/status',
        description: 'Get transcode job status',
      },
      {
        method: 'GET',
        path: '/:id/transcode/:jobId/url',
        description: 'Get transcode output URL',
      },
      { method: 'POST', path: '/:id/scan', description: 'Queue content safety scan' },
      { method: 'POST', path: '/categories', description: 'Create category' },
      { method: 'PATCH', path: '/categories/:id', description: 'Update category' },
      { method: 'DELETE', path: '/categories/:id', description: 'Delete category' },
      {
        method: 'GET',
        path: '/categories/:id/content',
        description: 'List content in a category',
      },
      { method: 'POST', path: '/tags', description: 'Create tag' },
      { method: 'PATCH', path: '/tags/:id', description: 'Update tag' },
      { method: 'DELETE', path: '/tags/:id', description: 'Delete tag' },
      { method: 'GET', path: '/tags/:id/content', description: 'List content with a tag' },
      { method: 'POST', path: '/downloads', description: 'Start a download session' },
      {
        method: 'POST',
        path: '/downloads/:downloadId/progress',
        description: 'Report download progress',
      },
      {
        method: 'DELETE',
        path: '/downloads/:downloadId',
        description: 'Release a download session',
      },
      { method: 'GET', path: '/downloads/storage', description: 'Get download storage usage' },
      {
        method: 'GET',
        path: '/extras/:extraId/access',
        description: 'Check extra-content access',
      },
      { method: 'GET', path: '/passes/access', description: 'Check cinema-pass access' },
      {
        method: 'GET',
        path: '/rentals/:contentId/access',
        description: 'Check rental access for content',
      },
      {
        method: 'GET',
        path: '/screenings/:screeningId/access',
        description: 'Check screening access',
      },
      {
        method: 'POST',
        path: '/validate/acdp',
        description: 'Validate content against ACDP policy',
      },
      {
        method: 'POST',
        path: '/validate/release-window',
        description: 'Validate content release window',
      },
      {
        method: 'POST',
        path: '/validate/universe-fit',
        description: 'Validate content universe fit',
      },
    ],
  },
  {
    path: '/reviews',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      // reviews.controller @Controller('reviews') on content-service
      { method: 'POST', path: '/', description: 'Create a review' },
      { method: 'GET', path: '/content/:contentId', description: 'List reviews for content' },
      {
        method: 'GET',
        path: '/content/:contentId/summary',
        description: 'Review summary for content',
      },
      {
        method: 'GET',
        path: '/content/:contentId/mine',
        description: 'Current-user review for content',
      },
      { method: 'POST', path: '/:reviewId/helpful', description: 'Mark review helpful' },
      { method: 'POST', path: '/:reviewId/report', description: 'Report a review' },
      { method: 'GET', path: '/admin/pending', description: 'Reviews pending moderation' },
      {
        method: 'PATCH',
        path: '/admin/:reviewId/moderate',
        description: 'Moderate a review (admin)',
      },
      { method: 'DELETE', path: '/:reviewId', description: 'Delete a review' },
    ],
  },
  {
    path: '/sharing',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      // sharing.controller @Controller('sharing') on content-service
      { method: 'POST', path: '/link', description: 'Create a share link' },
      {
        method: 'GET',
        path: '/resolve/:shortCode',
        description: 'Resolve a share short code',
      },
      {
        method: 'GET',
        path: '/preview/:contentId',
        description: 'Share preview payload',
      },
      {
        method: 'GET',
        path: '/analytics/:contentId',
        description: 'Share analytics for content',
      },
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
      // (/metrics lives on the metrics controller outside the versioned API;
      // scrape it upstream directly, not through the gateway.)
      { method: 'GET', path: '/admin/stats', description: 'Search service stats (admin)' },
      { method: 'GET', path: '/admin/queries', description: 'Search query log (admin)' },
      {
        method: 'POST',
        path: '/admin/indexes/repair',
        description:
          'Recreate missing GIN trigram indexes (self-heal; Alertmanager webhook target)',
      },
      // ---- Undeclared-surface ratchet pass ----
      {
        method: 'GET',
        path: '/quality/metrics',
        description: 'Search quality metrics',
      },
      {
        method: 'POST',
        path: '/track/zero-result',
        description: 'Track a zero-result query',
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
      // ---- Undeclared-surface ratchet pass (email + SLO) ----
      {
        method: 'POST',
        path: '/email',
        description: 'Send a transactional email',
      },
      {
        method: 'GET',
        path: '/slo/status',
        description: 'Notification SLO status',
      },
      {
        method: 'GET',
        path: '/slo/measure',
        description: 'Measure notification SLO',
      },
    ],
  },
  {
    path: '/push',
    envKey: 'NOTIFICATION_SERVICE_URL',
    // AUD-04 fix: 3023 is engagement-service; notification-service listens on
    // 3006 (same envKey as /notifications, which resolves 3006).
    fallbackUrl: 'http://notification-service:3006',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      // push-notification.controller @Controller('push')
      { method: 'POST', path: '/register', description: 'Register a push token' },
      {
        method: 'DELETE',
        path: '/register/:token',
        description: 'Unregister a push token',
      },
      { method: 'GET', path: '/topics', description: 'List push topics' },
      { method: 'POST', path: '/send', description: 'Send a push to a user' },
      {
        method: 'POST',
        path: '/send-bulk',
        description: 'Send pushes to many users',
      },
      {
        method: 'POST',
        path: '/send-topic',
        description: 'Send a push to a topic',
      },
      {
        method: 'POST',
        path: '/subscribe/:topic',
        description: 'Subscribe to a push topic',
      },
      {
        method: 'POST',
        path: '/unsubscribe/:topic',
        description: 'Unsubscribe from a push topic',
      },
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
      { method: 'GET', path: '/redeem-options', description: 'List active rewards for redemption' },
      { method: 'POST', path: '/redeem', description: 'Redeem reward points' },
      { method: 'GET', path: '/history', description: 'Get reward history' },
      { method: 'GET', path: '/level', description: 'Get the caller\'s reward level' },
      { method: 'GET', path: '/balance', description: 'Get the caller\'s points balance' },
      { method: 'GET', path: '/redeem-options', description: 'List active rewards available for redemption' },
      { method: 'GET', path: '/balance', description: 'Get points balance' },
      { method: 'GET', path: '/missions', description: 'List active missions' },
      { method: 'GET', path: '/badges', description: 'List badges' },
      { method: 'GET', path: '/streak', description: 'Get streak' },
      // ---- Undeclared-surface ratchet pass ----
      {
        method: 'GET',
        path: '/abuse-check',
        description: 'Reward abuse pre-check',
      },
      {
        method: 'POST',
        path: '/admin/adjust',
        description: 'Adjust a user reward balance (admin)',
      },
    ],
  },
  {
    path: '/analytics',
    envKey: 'ANALYTICS_SERVICE_URL',
    fallbackUrl: 'http://analytics-service:3008',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    // analytics-service mounts most controllers at the root (/v1/agents,
    // /v1/risk, /v1/tasks, ...) but keeps the core AnalyticsController UNDER
    // @Controller('analytics') (/v1/analytics/events, /v1/analytics/kpis,
    // /v1/analytics/search/corrections, ...). Only strip the '/analytics'
    // segment for the root-mounted families; stripping it unconditionally
    // rewrites /v1/analytics/search/corrections to /v1/search/corrections,
    // which no controller serves (404 for cookie-only SPA traffic).
    pathRewrite: {
      '^/v1/analytics(?=/(agents|cost|risk|tasks|capacity|reports|intelligence|instrumentation|metrics|admin|health)(/|$))':
        '/v1',
    },
    endpoints: [
      { method: 'POST', path: '/events', description: 'Track analytics event' },
      { method: 'POST', path: '/track-batch', description: 'Track a batch of events' },
      { method: 'POST', path: '/web-vitals', description: 'Ingest Web Vitals metrics' },
      { method: 'GET', path: '/kpis', description: 'Get platform KPIs' },
      { method: 'GET', path: '/funnels', description: 'Get funnel analytics' },
      { method: 'GET', path: '/cohorts', description: 'Get cohort analytics' },
      { method: 'GET', path: '/search/corrections', description: 'Search correction acceptance' },
      // AOS-MA-001 — Agent Registry
      { method: 'POST', path: '/agents', description: 'Register a new agent' },
      { method: 'GET', path: '/agents', description: 'List all registered agents' },
      { method: 'GET', path: '/agents/:agentId', description: 'Get agent by ID' },
      { method: 'PUT', path: '/agents/:agentId', description: 'Update agent configuration' },
      { method: 'POST', path: '/agents/:agentId/resume', description: 'Resume suspended agent' },
      { method: 'POST', path: '/agents/:agentId/retire', description: 'Retire an agent' },
      {
        method: 'GET',
        path: '/agents/:agentId/kill-switch-history',
        description: 'Get kill switch history',
      },
      {
        method: 'POST',
        path: '/agents/:agentId/kill-switch',
        description: 'Trigger a kill switch for an agent',
      },
      {
        method: 'POST',
        path: '/risk/approvals/:approvalId/decide',
        description: 'Approve or reject a risk approval',
      },
      {
        method: 'GET',
        path: '/agents/stats/overview',
        description: 'Get agent stats overview',
      },
      {
        method: 'GET',
        path: '/risk/approvals/pending',
        description: 'List pending risk approvals',
      },
      // AOS-MA-001 — Model Cost Tracker
      { method: 'POST', path: '/cost/events', description: 'Record model cost event' },
      { method: 'GET', path: '/cost/summary', description: 'Get cost summary' },
      { method: 'GET', path: '/cost/events', description: 'Get recent cost events' },
      { method: 'GET', path: '/cost/budget/:agentId', description: 'Check agent budget' },
      // AOS-MA-001 — Risk Engine
      { method: 'POST', path: '/risk/classifications', description: 'Create risk classification' },
      { method: 'GET', path: '/risk/classifications', description: 'List risk classifications' },
      { method: 'GET', path: '/risk', description: 'Risk engine overview' },
      {
        method: 'PUT',
        path: '/risk/classifications/:actionType',
        description: 'Update risk classification',
      },
      { method: 'POST', path: '/risk/assess/:actionType', description: 'Assess risk for an action' },
      // AOS-MA-001 — Task Router
      { method: 'POST', path: '/tasks/classifications', description: 'Create task classification' },
      { method: 'GET', path: '/tasks/classifications', description: 'List task classifications' },
      { method: 'GET', path: '/tasks', description: 'Task router overview' },
      {
        method: 'GET',
        path: '/tasks/classifications/stats',
        description: 'Get classification stats',
      },
      {
        method: 'PUT',
        path: '/tasks/classifications/:taskType',
        description: 'Update task classification',
      },
      {
        method: 'POST',
        path: '/tasks/route/:taskType',
        description: 'Route task to execution tier',
      },
      // AOS-MA-001 — Capacity Ledger
      { method: 'POST', path: '/capacity/entries', description: 'Record capacity entry' },
      { method: 'GET', path: '/capacity/entries', description: 'List capacity entries' },
      { method: 'GET', path: '/capacity', description: 'Capacity ledger overview' },
      {
        method: 'GET',
        path: '/capacity/summary/:period',
        description: 'Get period capacity summary',
      },
      {
        method: 'POST',
        path: '/capacity/entries/:id/validate',
        description: 'Validate capacity entry',
      },
      {
        method: 'POST',
        path: '/capacity/seed',
        description: 'Seed capacity ledger with sample data',
      },
      { method: 'GET', path: '/risk/stats', description: 'Get risk engine statistics' },
      { method: 'POST', path: '/risk/seed', description: 'Seed risk classifications' },
      { method: 'POST', path: '/tasks/seed', description: 'Seed task classifications' },
      {
        method: 'DELETE',
        path: '/tasks/classifications/:taskType',
        description: 'Delete task classification',
      },
      {
        method: 'POST',
        path: '/agents/seed',
        description: 'Seed the agent registry (AOS-MA-001)',
      },
      // ---- Undeclared-surface ratchet pass (declare the real surface) ----
      { method: 'DELETE', path: '/agents/:agentId', description: 'Delete an agent' },
      {
        method: 'POST',
        path: '/agents/:agentId/execution',
        description: 'Trigger an agent execution',
      },
      {
        method: 'GET',
        path: '/agents/:agentId/evaluations',
        description: 'List agent evaluations',
      },
      {
        method: 'POST',
        path: '/agents/:agentId/evaluations',
        description: 'Create agent evaluation',
      },
      {
        method: 'GET',
        path: '/agents/:agentId/evaluations/summary',
        description: 'Agent evaluations summary',
      },
      {
        method: 'GET',
        path: '/agents/:agentId/health',
        description: 'Agent health detail',
      },
      {
        method: 'GET',
        path: '/agents/health/overview',
        description: 'Agent fleet health overview',
      },
      { method: 'GET', path: '/bootstrap', description: 'Analytics bootstrap data' },
      {
        method: 'GET',
        path: '/campaigns/attribution',
        description: 'Campaign attribution',
      },
      { method: 'GET', path: '/dashboard', description: 'Analytics dashboard' },
      {
        method: 'GET',
        path: '/dashboard/detailed',
        description: 'Detailed analytics dashboard',
      },
      { method: 'GET', path: '/daily-stats', description: 'Daily event stats' },
      { method: 'GET', path: '/engagement', description: 'Engagement analytics' },
      { method: 'GET', path: '/me/summary', description: 'Current-user analytics summary' },
      { method: 'GET', path: '/realtime', description: 'Realtime analytics feed' },
      { method: 'GET', path: '/retention', description: 'Retention analytics' },
      { method: 'GET', path: '/revenue', description: 'Revenue analytics' },
      { method: 'GET', path: '/universe-kpis', description: 'Per-universe KPIs' },
      {
        method: 'GET',
        path: '/universe-kpis/:universeName',
        description: 'KPIs for one universe',
      },
      {
        method: 'GET',
        path: '/wep/contribution',
        description: 'WEP contribution metrics',
      },
      { method: 'GET', path: '/wep/platform', description: 'WEP platform metrics' },
      {
        method: 'GET',
        path: '/wep/user/:userId',
        description: 'Per-user WEP metrics',
      },
      { method: 'GET', path: '/admin/event-names', description: 'Distinct event names (admin)' },
      { method: 'GET', path: '/admin/events', description: 'List analytics events (admin)' },
      { method: 'GET', path: '/admin/stats', description: 'Analytics service stats (admin)' },
      {
        method: 'GET',
        path: '/instrumentation/event-names',
        description: 'Distinct instrumentation event names',
      },
      {
        method: 'POST',
        path: '/instrumentation/content-impression',
        description: 'Ingest content impression event',
      },
      {
        method: 'POST',
        path: '/instrumentation/game',
        description: 'Ingest game event',
      },
      {
        method: 'POST',
        path: '/instrumentation/payment',
        description: 'Ingest payment event',
      },
      {
        method: 'POST',
        path: '/instrumentation/prediction',
        description: 'Ingest prediction event',
      },
      {
        method: 'POST',
        path: '/instrumentation/reward',
        description: 'Ingest reward event',
      },
      {
        method: 'POST',
        path: '/instrumentation/screen-view',
        description: 'Ingest screen-view event',
      },
      {
        method: 'POST',
        path: '/instrumentation/share',
        description: 'Ingest share event',
      },
      {
        method: 'POST',
        path: '/instrumentation/track',
        description: 'Ingest generic instrumentation event',
      },
      {
        method: 'POST',
        path: '/instrumentation/track-batch',
        description: 'Ingest batched instrumentation events',
      },
      { method: 'GET', path: '/intelligence/churn-risks', description: 'List churn risks' },
      {
        method: 'POST',
        path: '/intelligence/churn-risks/:userId/calculate',
        description: 'Calculate churn risk for a user',
      },
      {
        method: 'GET',
        path: '/intelligence/creator-scores',
        description: 'List creator scores',
      },
      {
        method: 'POST',
        path: '/intelligence/creator-scores/:creatorId/calculate',
        description: 'Calculate creator score',
      },
      { method: 'GET', path: '/intelligence/fraud-detections', description: 'List fraud detections' },
      {
        method: 'POST',
        path: '/intelligence/fraud-detections',
        description: 'Create fraud detection',
      },
      {
        method: 'POST',
        path: '/intelligence/fraud-detections/:id/review',
        description: 'Review a fraud detection',
      },
      {
        method: 'GET',
        path: '/intelligence/personalization',
        description: 'Personalization feed',
      },
      { method: 'GET', path: '/intelligence/retention', description: 'Retention intelligence' },
      { method: 'GET', path: '/intelligence/segments', description: 'List intelligence segments' },
      {
        method: 'POST',
        path: '/intelligence/segments',
        description: 'Create intelligence segment',
      },
      { method: 'GET', path: '/reports', description: 'List report definitions' },
      { method: 'POST', path: '/reports', description: 'Create report definition' },
      { method: 'GET', path: '/reports/:id', description: 'Get report definition' },
      { method: 'PUT', path: '/reports/:id', description: 'Update report definition' },
      { method: 'DELETE', path: '/reports/:id', description: 'Delete report definition' },
      {
        method: 'GET',
        path: '/reports/:id/executions',
        description: 'List report executions',
      },
      { method: 'POST', path: '/reports/execute', description: 'Execute a report' },
      { method: 'POST', path: '/risk/approvals', description: 'Create risk approval' },
      {
        method: 'POST',
        path: '/risk/approvals/:approvalId/revoke',
        description: 'Revoke a risk approval',
      },
      {
        method: 'GET',
        path: '/risk/approvals/history/:actionType',
        description: 'Risk approval history by action type',
      },
      { method: 'GET', path: '/risk/audit-log', description: 'Risk engine audit log' },
      {
        method: 'GET',
        path: '/risk/classifications/:actionType',
        description: 'Risk classification by action type',
      },
      {
        method: 'DELETE',
        path: '/risk/classifications/:actionType',
        description: 'Delete risk classification',
      },
      {
        method: 'GET',
        path: '/risk/definitions/autonomy-levels',
        description: 'List autonomy level definitions',
      },
      {
        method: 'GET',
        path: '/risk/definitions/risk-levels',
        description: 'List risk level definitions',
      },
      { method: 'POST', path: '/tasks/auto-classify', description: 'Auto-classify a task' },
      { method: 'POST', path: '/tasks/executions', description: 'Record task execution' },
      {
        method: 'GET',
        path: '/tasks/executions/history/:taskType',
        description: 'Task execution history by type',
      },
      { method: 'GET', path: '/tasks/executions/stats', description: 'Task execution stats' },
      {
        method: 'GET',
        path: '/tasks/process-mining',
        description: 'Task process-mining report',
      },
      { method: 'POST', path: '/track', description: 'Track analytics event (alias)' },
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
    fallbackUrl: 'http://admin-app:4016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    // apps/admin is a standalone NestJS app with URI versioning
    // (enableVersioning URI, prefix 'v'), so it serves /v1/admin/*.
    // The 'default' strategy builds /v{version}/admin{path}, matching it.
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/dashboard/stats', description: 'Get admin dashboard stats' },
      { method: 'GET', path: '/dashboard/revenue', description: 'Get revenue data' },
      { method: 'GET', path: '/dashboard/platform-overview', description: 'Get platform overview' },
      {
        method: 'GET',
        path: '/dashboard/governance-summary',
        description: 'Governance summary: dual-control approvals + clearance health',
      },
      { method: 'GET', path: '/users', description: 'List users' },
      { method: 'GET', path: '/users/:id', description: 'Get user details' },
      { method: 'DELETE', path: '/users/:id', description: 'Delete a user' },
      { method: 'PUT', path: '/users/:id/role', description: 'Update user role' },
      { method: 'PUT', path: '/users/:id/suspend', description: 'Suspend a user' },
      {
        method: 'PUT',
        path: '/users/:id/suspension/revoke',
        description: 'Revoke a user suspension',
      },
      { method: 'POST', path: '/users/:id/verify', description: 'Verify a creator' },
      { method: 'POST', path: '/users/:id/unverify', description: 'Unverify a creator' },
      { method: 'POST', path: '/users/bulk/suspend', description: 'Bulk suspend users' },
      {
        method: 'GET',
        path: '/wallets/payouts',
        description: 'List payout requests',
      },
      {
        method: 'PUT',
        path: '/wallets/payouts/:id/approve',
        description: 'Approve payout request',
      },
      {
        method: 'PUT',
        path: '/wallets/payouts/:id/reject',
        description: 'Reject payout request',
      },
      {
        method: 'GET',
        path: '/payment-gateways/:id/webhooks',
        description: 'List gateway webhook deliveries',
      },
      { method: 'GET', path: '/content', description: 'List content for moderation' },
      { method: 'POST', path: '/content', description: 'Create content (admin)' },
      { method: 'GET', path: '/content/:id', description: 'Get content details' },
      { method: 'PATCH', path: '/content/:id', description: 'Update content (admin)' },
      { method: 'DELETE', path: '/content/:id', description: 'Delete content (admin)' },
      { method: 'POST', path: '/content/categories', description: 'Create content category' },
      { method: 'PUT', path: '/content/categories/:id', description: 'Update content category' },
      { method: 'DELETE', path: '/content/categories/:id', description: 'Delete content category' },
      { method: 'POST', path: '/content/tags', description: 'Create content tag' },
      { method: 'DELETE', path: '/content/tags/:id', description: 'Delete content tag' },
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
      {
        method: 'DELETE',
        path: '/notification-templates/:id',
        description: 'Delete notification template',
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
      { method: 'POST', path: '/reality-shows', description: 'Create reality show' },
      {
        method: 'PUT',
        path: '/reality-shows/:id/status',
        description: 'Update reality show status',
      },
      { method: 'GET', path: '/reports', description: 'Get reports' },
      { method: 'POST', path: '/reports', description: 'Create report' },
      { method: 'DELETE', path: '/reports/:id', description: 'Delete report' },
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
      { method: 'PUT', path: '/wallets/:walletId/status', description: 'Update wallet status' },
      { method: 'POST', path: '/wallets/:walletId/adjust', description: 'Adjust wallet balance' },
      { method: 'PUT', path: '/moderation/reports/:id/resolve', description: 'Resolve a report' },
      { method: 'PUT', path: '/moderation/reports/:id/dismiss', description: 'Dismiss a report' },
      { method: 'GET', path: '/moderation/reports', description: 'List moderation reports' },
      { method: 'POST', path: '/moderation/safety-action', description: 'Apply a safety action' },
      { method: 'GET', path: '/moderation/safety-actions', description: 'List recent safety actions' },
      {
        method: 'GET',
        path: '/moderation/reports/stats',
        description: 'Get moderation report stats',
      },
      { method: 'GET', path: '/support/stats', description: 'Get support stats' },
      { method: 'GET', path: '/support/tickets', description: 'Get support tickets' },
      { method: 'GET', path: '/support/tickets/:id', description: 'Get support ticket detail' },
      { method: 'PUT', path: '/support/tickets/:id/status', description: 'Update ticket status' },
      { method: 'PUT', path: '/support/tickets/:id/assign', description: 'Assign ticket' },
      { method: 'POST', path: '/support/tickets/:id/reply', description: 'Reply to ticket' },
      { method: 'GET', path: '/ops/status', description: 'Get ops scheduler status' },
      { method: 'GET', path: '/ops/services', description: 'Get per-service health' },
      { method: 'GET', path: '/ops/tipping-summary', description: 'Get tipping summary' },
      { method: 'GET', path: '/ops/tipping-config', description: 'Get tipping configuration' },
      { method: 'PUT', path: '/ops/tipping-config', description: 'Update tipping configuration' },
      { method: 'GET', path: '/ops/gateway-http', description: 'Get gateway HTTP metrics' },
      {
        method: 'GET',
        path: '/ops/gateway-rate-limits',
        description: 'Get gateway rate-limit metrics',
      },
      { method: 'POST', path: '/ops/run/:job', description: 'Run a scheduler job now' },
      {
        method: 'GET',
        path: '/ai-provenance',
        description: 'List AI provenance records with filters',
      },
      {
        method: 'PATCH',
        path: '/ai-provenance/:id/clearance',
        description: 'Set clearance decision for a provenance record',
      },
      {
        method: 'GET',
        path: '/dual-control',
        description: 'List dual-control requests with stats (TAA §55)',
      },
      {
        method: 'POST',
        path: '/dual-control',
        description: 'Create a dual-control request for a high-risk operation',
      },
      {
        method: 'POST',
        path: '/dual-control/:id/approve',
        description: 'Approve a dual-control request (two distinct admins required)',
      },
      {
        method: 'POST',
        path: '/dual-control/:id/reject',
        description: 'Reject a dual-control request with a reason',
      },
      {
        method: 'GET',
        path: '/rights/clearances',
        description: 'List rights clearances with filters and search',
      },
      {
        method: 'PATCH',
        path: '/rights/clearances/:id/status',
        description: 'Update rights clearance status',
      },
      // Content publish/unpublish via the admin app
      { method: 'POST', path: '/content/:id/publish', description: 'Publish content' },
      { method: 'POST', path: '/content/:id/unpublish', description: 'Unpublish content' },
      // Nightly flag sweep status (feature-flags controller)
      {
        method: 'GET',
        path: '/feature-flags/nightly/last',
        description: 'Get last nightly sweep result',
      },
      // Report builder execution (reports-admin controller)
      { method: 'POST', path: '/reports/:id/execute', description: 'Execute a saved report' },
      // Reality shows management (reality-shows controller)
      { method: 'GET', path: '/reality-shows/:id', description: 'Get reality show' },
      { method: 'PATCH', path: '/reality-shows/:id', description: 'Update reality show' },
      { method: 'DELETE', path: '/reality-shows/:id', description: 'Delete reality show' },
      // Subscription management (subscription-admin controller)
      { method: 'POST', path: '/subscriptions', description: 'Create subscription' },
      { method: 'PUT', path: '/subscriptions/:id', description: 'Update subscription' },
      { method: 'DELETE', path: '/subscriptions/:id', description: 'Delete subscription' },
      { method: 'POST', path: '/subscriptions/promo-codes', description: 'Create promo code' },
      {
        method: 'PUT',
        path: '/subscriptions/:id/status',
        description: 'Update subscription status',
      },
      {
        method: 'PUT',
        path: '/subscriptions/promo-codes/:id/expire',
        description: 'Expire a promo code',
      },
      {
        method: 'DELETE',
        path: '/subscriptions/promo-codes/:id',
        description: 'Delete a promo code',
      },
      // Agbala storyworld management (vertical/agbala controller)
      { method: 'POST', path: '/agbala/storyworlds', description: 'Create storyworld' },
      {
        method: 'POST',
        path: '/agbala/storyworlds/:id/characters',
        description: 'Create character in storyworld',
      },
      { method: 'POST', path: '/agbala/quizzes', description: 'Create quiz' },
      { method: 'GET', path: '/agbala/storyworlds/:id', description: 'Get storyworld' },
      { method: 'PATCH', path: '/agbala/storyworlds/:id', description: 'Update storyworld' },
      { method: 'DELETE', path: '/agbala/storyworlds/:id', description: 'Delete storyworld' },
      // (Characters/paths/quizzes are only mutated via their nested
      // storyworld routes; the SPA calls the nested shape.)
      { method: 'PATCH', path: '/agbala/characters/:id', description: 'Update character' },
      { method: 'DELETE', path: '/agbala/characters/:id', description: 'Delete character' },
      { method: 'PATCH', path: '/agbala/paths/:id', description: 'Update path' },
      { method: 'DELETE', path: '/agbala/paths/:id', description: 'Delete path' },
      { method: 'DELETE', path: '/agbala/quizzes/:id', description: 'Delete quiz' },
      {
        method: 'GET',
        path: '/agbala/storyworlds/:id/characters',
        description: 'List storyworld characters',
      },
      {
        method: 'POST',
        path: '/agbala/storyworlds/:id/paths',
        description: 'Create story path in a storyworld',
      },
      {
        method: 'GET',
        path: '/agbala/storyworlds/:id/paths',
        description: 'List storyworld paths',
      },
      {
        method: 'GET',
        path: '/agbala/moderation/review-queue',
        description: 'Agbala moderation review queue',
      },
      {
        method: 'POST',
        path: '/agbala/moderation/:id/approve',
        description: 'Approve an agbala moderation item',
      },
      {
        method: 'POST',
        path: '/agbala/moderation/:id/reject',
        description: 'Reject an agbala moderation item',
      },
      { method: 'GET', path: '/ops/pgbouncer', description: 'Pgbouncer pool stats' },
      {
        method: 'GET',
        path: '/ops/pgbouncer/foreign-persistence',
        description: 'Foreign-dialer persistence over window',
      },
      { method: 'GET', path: '/ops/transport-flips', description: 'Recent gateway transport flips' },
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
      // (Legacy /content-management declarations removed — the backend
      // controller now mounts at /admin/content, already declared above; the
      // SPA calls /api/v1/admin/content/bulk/*, which is declared too.)
      { method: 'GET', path: '/universes/stats', description: 'Universe statistics' },
      { method: 'GET', path: '/universes/feature-flags', description: 'All feature flags' },
      { method: 'GET', path: '/universes/relationships', description: 'Universe relationships' },
      { method: 'GET', path: '/universes/export/:id', description: 'Export universe' },
      { method: 'POST', path: '/universes/import', description: 'Import universes' },
      { method: 'POST', path: '/universes/bulk/toggle', description: 'Bulk toggle universes' },
      { method: 'POST', path: '/universes/:id/copy', description: 'Clone universe' },
      { method: 'GET', path: '/overview', description: 'Get platform overview' },
      { method: 'GET', path: '/audit', description: 'Get audit logs' },
      { method: 'GET', path: '/audit/actor/:actorId', description: 'Get audit logs by actor' },
      {
        method: 'GET',
        path: '/audit/target/:targetType/:targetId',
        description: 'Get audit logs by target',
      },
      { method: 'GET', path: '/subscriptions', description: 'List subscription plans' },
      { method: 'GET', path: '/subscriptions/stats', description: 'Get subscription stats' },
      { method: 'GET', path: '/subscriptions/:id', description: 'Get subscription plan' },
      { method: 'POST', path: '/content/bulk/delete', description: 'Bulk delete content' },
      { method: 'POST', path: '/content/bulk/status', description: 'Bulk update content status' },
      { method: 'GET', path: '/live-events', description: 'List live events (admin)' },
      { method: 'GET', path: '/live-events/:id', description: 'Get live event (admin)' },
      { method: 'POST', path: '/live-events', description: 'Create live event (admin)' },
      { method: 'PUT', path: '/live-events/:id', description: 'Update live event (admin)' },
      {
        method: 'DELETE',
        path: '/live-events/:id/cancel',
        description: 'Cancel live event (admin)',
      },
      // (Flat /agbala/characters and /agbala/paths listings removed — the
      // backend only serves them nested under /agbala/storyworlds/:id/*, and
      // the SPA calls the nested shape.)
      { method: 'GET', path: '/agbala/storyworlds', description: 'Get storyworlds' },
      { method: 'GET', path: '/agbala/quizzes', description: 'Get Agbala quizzes' },
      // ---- Undeclared-surface ratchet pass (SPA-served deep surface) ----
      {
        method: 'GET',
        path: '/dashboard/content-trend',
        description: 'Dashboard content trend',
      },
      {
        method: 'GET',
        path: '/dashboard/recent-activity',
        description: 'Dashboard recent activity',
      },
      {
        method: 'GET',
        path: '/dashboard/top-content',
        description: 'Dashboard top content',
      },
      {
        method: 'GET',
        path: '/dashboard/top-creators',
        description: 'Dashboard top creators',
      },
      {
        method: 'GET',
        path: '/moderation/reports/types',
        description: 'Moderation report types',
      },
      { method: 'GET', path: '/ops/runs', description: 'Ops scheduler run history' },
      {
        method: 'GET',
        path: '/users/:id/suspensions',
        description: 'Suspension history for a user',
      },
      {
        method: 'GET',
        path: '/content/versions/:id',
        description: 'Content version snapshot (admin)',
      },
    ],
  },
  {
    path: '/creator-entries',
    // Admin-backend's challenge-entry review proxy (:4016) → creator-service.
    // Kept separate from /admin so the SPA's /api/v1/creator-entries calls
    // resolve here; admin-backend adds auth + identity stamping upstream.
    envKey: 'ADMIN_SERVICE_URL',
    fallbackUrl: 'http://admin-app:4016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      {
        method: 'GET',
        path: '',
        description: 'Challenge entry review queue (admin/moderator)',
      },
      {
        method: 'PATCH',
        path: '/:entryId/review',
        description: 'Review a challenge entry: under_review | winner | rejected',
      },
    ],
  },
  {
    path: '/creator',
    // The standalone creator dashboard app (:4014), NOT the creator
    // microservice (:3018) — a dedicated env key so /creator and /creators
    // can point at different upstreams.
    envKey: 'CREATOR_APP_URL',
    fallbackUrl: 'http://creator-app:4014',
    supportedVersions: ['1'],
    defaultVersion: '1',
    // apps/creator is a standalone NestJS app with URI versioning
    // (enableVersioning URI, prefix 'v'), so it serves /v1/creator/* —
    // same as apps/admin. The 'default' strategy builds
    // /v{version}/creator{path}, matching it.
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/dashboard', description: 'Get creator dashboard' },
      { method: 'GET', path: '/flags', description: 'Get creator flags' },
      { method: 'GET', path: '/content', description: 'Get creator content' },
      { method: 'GET', path: '/content/:id/playback', description: 'Get playback info' },
      { method: 'POST', path: '/content', description: 'Create creator content' },
      { method: 'PATCH', path: '/content/:id', description: 'Update creator content' },
      { method: 'DELETE', path: '/content/:id', description: 'Delete creator content' },
      { method: 'GET', path: '/analytics', description: 'Get creator analytics' },
      { method: 'GET', path: '/earnings', description: 'Get creator earnings' },
      { method: 'GET', path: '/earnings/summary', description: 'Get creator earnings summary' },
      {
        method: 'GET',
        path: '/earnings/history',
        description: 'Get creator earnings transaction history',
      },
      { method: 'GET', path: '/payouts', description: 'Get payout history' },
      { method: 'POST', path: '/payouts/request', description: 'Request payout' },
      { method: 'PUT', path: '/payouts/settings', description: 'Update payout settings' },
      { method: 'GET', path: '/settings', description: 'Get creator settings' },
      { method: 'PUT', path: '/settings', description: 'Update creator settings' },
      { method: 'GET', path: '/drafts', description: 'Get draft content' },
      { method: 'GET', path: '/published', description: 'Get published content' },
      { method: 'GET', path: '/scheduled', description: 'Get scheduled content' },
      { method: 'POST', path: '/content/:id/publish', description: 'Publish creator content' },
      { method: 'GET', path: '/monetization', description: 'Get monetization settings' },
      { method: 'PUT', path: '/monetization', description: 'Update monetization settings' },
      { method: 'GET', path: '/monetization/settings', description: 'Get monetization settings' },
      { method: 'PATCH', path: '/monetization/settings', description: 'Update monetization settings' },
      { method: 'GET', path: '/monetization/tiers', description: 'List monetization tiers' },
      { method: 'POST', path: '/monetization/tiers', description: 'Create monetization tier' },
      { method: 'PUT', path: '/monetization/tiers/:id', description: 'Update monetization tier' },
      { method: 'DELETE', path: '/monetization/tiers/:id', description: 'Delete monetization tier' },
      { method: 'GET', path: '/profile', description: 'Get creator profile' },
      { method: 'PUT', path: '/profile', description: 'Update creator profile' },
      { method: 'GET', path: '/profile/:id', description: 'Get creator public profile' },
      { method: 'GET', path: '/subscribers', description: 'Get subscribers' },
      { method: 'GET', path: '/subscribers/stats', description: 'Get subscriber stats' },
      { method: 'GET', path: '/uploads', description: 'List uploads' },
      { method: 'POST', path: '/uploads', description: 'Create upload' },
      { method: 'GET', path: '/challenges', description: 'List challenges' },
      { method: 'GET', path: '/challenges/submissions', description: 'List challenge submissions' },
      {
        method: 'GET',
        path: '/challenges/submissions/:submissionId',
        description: 'Get challenge submission detail',
      },
      {
        method: 'GET',
        path: '/challenges/:challengeId/leaderboard',
        description: 'Get challenge leaderboard',
      },
      {
        method: 'POST',
        path: '/challenges/:challengeId/submit',
        description: 'Submit to a challenge',
      },
      {
        method: 'POST',
        path: '/archived/sweep',
        description: 'Trigger archived-content hard-delete sweep (admin)',
      },
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
      // Plural-prefix controllers (challenges, payouts, verification, uploads)
      { method: 'POST', path: '/challenges', description: 'Create a creator challenge' },
      {
        method: 'GET',
        path: '/challenges/entries',
        description: 'List challenge entries',
      },
      { method: 'GET', path: '/challenges/my', description: 'My challenge entries' },
      {
        method: 'POST',
        path: '/challenges/:challengeId/participate',
        description: 'Participate in a challenge',
      },
      {
        method: 'GET',
        path: '/payouts/history',
        description: 'Payout history',
      },
      {
        method: 'GET',
        path: '/payouts/summary',
        description: 'Payout summary',
      },
      {
        method: 'GET',
        path: '/verification/status',
        description: 'Creator verification status',
      },
      {
        method: 'POST',
        path: '/verification/submit',
        description: 'Submit verification request',
      },
      {
        method: 'POST',
        path: '/upload/initiate',
        description: 'Initiate a creator upload',
      },
      {
        method: 'POST',
        path: '/upload/complete',
        description: 'Complete a creator upload',
      },
      {
        method: 'POST',
        path: '/channels/:channelId/uploads',
        description: 'Upload to a channel',
      },
      { method: 'POST', path: '/onboard', description: 'Creator onboarding' },
      { method: 'GET', path: '/me', description: 'Get my creator profile' },
      { method: 'PATCH', path: '/me', description: 'Update creator profile' },
      { method: 'GET', path: '/:creatorId', description: 'Get creator public profile' },
      { method: 'POST', path: '/channels', description: 'Create channel' },
      { method: 'GET', path: '/channels', description: 'List my channels' },
      { method: 'POST', path: '/uploads', description: 'Create upload' },
      { method: 'GET', path: '/uploads', description: 'List own uploads' },
      { method: 'GET', path: '/discover', description: 'Creator discovery' },
      {
        method: 'PATCH',
        path: '/challenges/entries/:entryId/review',
        description: 'Review a challenge entry (admin/moderator)',
      },
      {
        method: 'GET',
        path: '/challenges/:challengeId/leaderboard',
        description: 'Get challenge leaderboard (winner-first)',
      },
      {
        method: 'GET',
        path: '/boards/:challengeId',
        description: 'Public read-only challenge board (logged-out viewers)',
      },
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
      { method: 'GET', path: '/reports', description: 'Get moderation reports' },
      { method: 'GET', path: '/reports/:reportId', description: 'Get report status' },
      {
        method: 'GET',
        path: '/safety-action-types',
        description: 'Available safety action types',
      },
    ],
  },
  {
    path: '/support',
    envKey: 'SUPPORT_SERVICE_URL',
    // AUD-04 fix: 3020 is knowledge-service; support-service listens on 3028.
    fallbackUrl: 'http://support-service:3028',
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
      // ---- Undeclared-surface ratchet pass (support tooling deep surface) ----
      {
        method: 'GET',
        path: '/dashboard/recent',
        description: 'Recent support activity',
      },
      {
        method: 'GET',
        path: '/dashboard/sla-metrics',
        description: 'SLA metrics',
      },
      {
        method: 'GET',
        path: '/tickets/:id/access-check',
        description: 'Check current-user ticket access',
      },
      { method: 'GET', path: '/tickets/:id/pii', description: 'Unmask ticket PII (admin)' },
      { method: 'GET', path: '/refunds/:id', description: 'Refund detail' },
      {
        method: 'PATCH',
        path: '/refunds/:id/process',
        description: 'Process a refund (admin)',
      },
      {
        method: 'PATCH',
        path: '/refunds/:id/reject',
        description: 'Reject a refund (admin)',
      },
      { method: 'GET', path: '/disputes/:id', description: 'Dispute detail' },
      { method: 'GET', path: '/disputes/my', description: 'My disputes' },
      {
        method: 'GET',
        path: '/disputes/pending',
        description: 'Pending disputes (admin)',
      },
      {
        method: 'PATCH',
        path: '/disputes/:id/resolve',
        description: 'Resolve a dispute (admin)',
      },
      { method: 'GET', path: '/chargebacks/:id', description: 'Chargeback detail' },
      { method: 'GET', path: '/chargebacks/my', description: 'My chargebacks' },
      {
        method: 'GET',
        path: '/chargebacks/pending',
        description: 'Pending chargebacks (admin)',
      },
      {
        method: 'POST',
        path: '/chargebacks/:id/evidence',
        description: 'Attach chargeback evidence',
      },
      {
        method: 'PATCH',
        path: '/chargebacks/:id/resolve',
        description: 'Resolve a chargeback (admin)',
      },
      { method: 'GET', path: '/appeals/:id', description: 'Appeal detail' },
      { method: 'GET', path: '/appeals/my', description: 'My appeals' },
      {
        method: 'GET',
        path: '/appeals/pending',
        description: 'Pending appeals (admin)',
      },
      {
        method: 'PATCH',
        path: '/appeals/:id/decide',
        description: 'Decide an appeal (admin)',
      },
      { method: 'GET', path: '/takedowns/:id', description: 'Takedown detail' },
      {
        method: 'GET',
        path: '/takedowns/content/:contentId',
        description: 'Takedowns for content',
      },
      {
        method: 'GET',
        path: '/takedowns/pending',
        description: 'Pending takedowns (admin)',
      },
      {
        method: 'PATCH',
        path: '/takedowns/:id/decide',
        description: 'Decide a takedown (admin)',
      },
      { method: 'GET', path: '/suspensions/:id', description: 'Suspension detail' },
      {
        method: 'GET',
        path: '/suspensions/active',
        description: 'Active suspensions (admin)',
      },
      { method: 'GET', path: '/suspensions/my', description: 'My suspensions' },
      {
        method: 'GET',
        path: '/suspensions/user/:userId',
        description: 'Suspension history for a user',
      },
      {
        method: 'GET',
        path: '/suspensions/user/:userId/active',
        description: 'Active suspensions for a user',
      },
      {
        method: 'POST',
        path: '/suspensions/:id/lift',
        description: 'Lift a suspension (admin)',
      },
      {
        method: 'POST',
        path: '/suspensions/:id/reinstate',
        description: 'Reinstate a suspension (admin)',
      },
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
      // ---- Undeclared-surface ratchet pass (rankings + prediction mgmt) ----
      { method: 'POST', path: '/rankings', description: 'Submit a ranking entry' },
      {
        method: 'POST',
        path: '/rankings/batch',
        description: 'Submit ranking entries in batch',
      },
      {
        method: 'GET',
        path: '/rankings/history/:userId',
        description: 'Ranking history for a user',
      },
      {
        method: 'DELETE',
        path: '/rankings/:userId/:category',
        description: 'Delete a ranking entry',
      },
      {
        method: 'GET',
        path: '/leaderboard/export',
        description: 'Export the leaderboard',
      },
      {
        method: 'DELETE',
        path: '/leaderboard/:userId/:category',
        description: 'Delete a leaderboard entry',
      },
      {
        method: 'POST',
        path: '/predictions/bulk',
        description: 'Submit predictions in bulk',
      },
      {
        method: 'GET',
        path: '/predictions/history',
        description: 'Prediction history for current user',
      },
      {
        method: 'PUT',
        path: '/predictions/:predictionId',
        description: 'Update a prediction',
      },
      {
        method: 'DELETE',
        path: '/predictions/:predictionId',
        description: 'Delete a prediction',
      },
    ],
  },
  {
    path: '/messaging',
    envKey: 'MESSAGING_SERVICE_URL',
    fallbackUrl: 'http://messaging-service:3024',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    // Watch-party chat lives at @Controller('watch-parties') upstream —
    // strip the /messaging umbrella so client paths keep a single prefix.
    pathRewrite: {
      '^/v1/messaging/watch-parties': '/v1/watch-parties',
    },
    endpoints: [
      // Watch-party chat (watch-party.controller @Controller('watch-parties'))
      { method: 'GET', path: '/watch-parties/:partyId/chat', description: 'Get watch-party chat' },
      {
        method: 'POST',
        path: '/watch-parties/:partyId/chat',
        description: 'Send watch-party chat message',
      },
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
      {
        method: 'POST',
        path: '/conversations/:id/messages/:messageId/react',
        description: 'React to message',
      },
      // ---- Undeclared-surface ratchet pass (threads, search, participants) ----
      {
        method: 'GET',
        path: '/conversations/search',
        description: 'Search conversations',
      },
      { method: 'GET', path: '/messages/search', description: 'Search messages' },
      {
        method: 'PUT',
        path: '/conversations/:conversationId',
        description: 'Update conversation settings',
      },
      {
        method: 'POST',
        path: '/conversations/:conversationId/participants',
        description: 'Add a participant',
      },
      {
        method: 'DELETE',
        path: '/conversations/:conversationId/participants/:userId',
        description: 'Remove a participant',
      },
      {
        method: 'POST',
        path: '/conversations/:conversationId/messages/reply',
        description: 'Reply to a message (thread)',
      },
      {
        method: 'GET',
        path: '/conversations/:conversationId/messages/:messageId/thread',
        description: 'Get a message thread',
      },
      {
        method: 'GET',
        path: '/conversations/:conversationId/messages/:messageId/reactions',
        description: 'Get message reactions',
      },
    ],
  },
  {
    path: '/watch-parties',
    envKey: 'MESSAGING_SERVICE_URL',
    fallbackUrl: 'http://messaging-service:3024',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      // watch-party.controller @Controller('watch-parties')
      { method: 'POST', path: '/', description: 'Create a watch party' },
      { method: 'POST', path: '/join', description: 'Join a watch party' },
      { method: 'GET', path: '/my', description: 'My watch parties' },
      { method: 'GET', path: '/:partyId', description: 'Watch party detail' },
      { method: 'DELETE', path: '/:partyId', description: 'End a watch party' },
      {
        method: 'POST',
        path: '/:partyId/playback',
        description: 'Update watch party playback',
      },
      {
        method: 'POST',
        path: '/:partyId/sync',
        description: 'Sync watch party playback state',
      },
      {
        method: 'POST',
        path: '/:partyId/leave',
        description: 'Leave a watch party',
      },
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
      // ---- Undeclared-surface ratchet pass (uploads + signed URLs + transcodes) ----
      { method: 'POST', path: '/upload/audio', description: 'Upload audio' },
      { method: 'POST', path: '/upload/document', description: 'Upload document' },
      { method: 'POST', path: '/upload/thumbnail', description: 'Upload thumbnail' },
      { method: 'POST', path: '/upload/banner', description: 'Upload banner' },
      {
        method: 'POST',
        path: '/upload/chunked/init',
        description: 'Initialize a chunked upload',
      },
      {
        method: 'PUT',
        path: '/upload/chunked/:uploadId/:index',
        description: 'Upload one chunk',
      },
      {
        method: 'POST',
        path: '/upload/chunked/:uploadId/complete',
        description: 'Complete a chunked upload',
      },
      {
        method: 'POST',
        path: '/premium/url',
        description: 'Mint a signed premium media URL',
      },
      {
        method: 'POST',
        path: '/premium/url/cdn',
        description: 'Mint a CDN-backed premium media URL',
      },
      {
        method: 'POST',
        path: '/premium/url/validate',
        description: 'Validate a premium media URL token',
      },
      {
        method: 'DELETE',
        path: '/premium/url/:token',
        description: 'Revoke a premium media URL token',
      },
      {
        method: 'DELETE',
        path: '/premium/urls/user',
        description: 'Revoke all premium URLs for a user',
      },
      {
        method: 'GET',
        path: '/premium/url/:token/analytics',
        description: 'Premium URL access analytics',
      },
      {
        method: 'GET',
        path: '/transcoding/:jobId/status',
        description: 'Transcode job status',
      },
      {
        method: 'GET',
        path: '/transcoding/jobs',
        description: 'List transcode jobs',
      },
      {
        method: 'POST',
        path: '/transcoding/retry-failed',
        description: 'Retry failed transcode jobs',
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
      // comedy-feed.controller @Controller('comedy')
      { method: 'GET', path: '/', description: 'Comedy feed' },
      { method: 'GET', path: '/trending', description: 'Get trending comedy' },
      { method: 'GET', path: '/categories', description: 'Comedy categories (special genres)' },
      { method: 'GET', path: '/top-rated', description: 'Top-rated clips (most liked)' },
      { method: 'GET', path: '/comedians', description: 'List comedians' },
      { method: 'GET', path: '/comedians/:id', description: 'Comedian details' },
      { method: 'GET', path: '/specials', description: 'Comedy specials' },
      { method: 'GET', path: '/specials/:id', description: 'Special details' },
      { method: 'GET', path: '/clips', description: 'Comedy clips' },
      { method: 'GET', path: '/clips/:id', description: 'Clip details' },
      { method: 'GET', path: '/series', description: 'Comedy series' },
      { method: 'GET', path: '/challenges', description: 'Comedy challenges' },
      { method: 'POST', path: '/challenges', description: 'Create comedy challenge' },
      { method: 'POST', path: '/clips/:clipId/share', description: 'Share a clip' },
      // ---- Undeclared-surface ratchet pass (clip interactions + trends) ----
      { method: 'POST', path: '/clips/:id/like', description: 'Like a clip' },
      {
        method: 'POST',
        path: '/clips/:id/comment',
        description: 'Comment on a clip',
      },
      { method: 'POST', path: '/specials/:id/like', description: 'Like a special' },
      {
        method: 'POST',
        path: '/trends/record',
        description: 'Record comedy trend scores',
      },
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
      { method: 'POST', path: '/sessions', description: 'Start a trivia game session' },
      {
        method: 'POST',
        path: '/sessions/:sessionId/submit',
        description: 'Submit trivia session answers',
      },
      // Games tournaments (games-service @Controller('games/tournaments'))
      { method: 'GET', path: '/tournaments/:id', description: 'Get tournament details' },
      { method: 'POST', path: '/tournaments/:id/enter', description: 'Enter a tournament' },
      {
        method: 'GET',
        path: '/tournaments/:id/leaderboard',
        description: 'Get tournament leaderboard',
      },
      // ---- Undeclared-surface ratchet pass (sessions, gameplay, tournaments admin) ----
      { method: 'POST', path: '/:gameId/start', description: 'Start a game session' },
      {
        method: 'POST',
        path: '/:sessionId/complete',
        description: 'Complete a game session',
      },
      { method: 'POST', path: '/answer', description: 'Submit a game answer' },
      {
        method: 'GET',
        path: '/stats/:userId',
        description: 'Game stats for a user',
      },
      {
        method: 'POST',
        path: '/daily-challenge/submit',
        description: 'Submit a daily challenge entry',
      },
      {
        method: 'POST',
        path: '/multiplayer/sessions',
        description: 'Create a multiplayer session',
      },
      {
        method: 'GET',
        path: '/multiplayer/game/:gameId/sessions',
        description: 'List sessions for a game',
      },
      {
        method: 'GET',
        path: '/multiplayer/sessions/:sessionId',
        description: 'Multiplayer session detail',
      },
      {
        method: 'POST',
        path: '/multiplayer/sessions/:sessionId/join',
        description: 'Join a multiplayer session',
      },
      {
        method: 'POST',
        path: '/multiplayer/sessions/:sessionId/start',
        description: 'Start a multiplayer session',
      },
      {
        method: 'POST',
        path: '/tournaments/:id/score',
        description: 'Submit a tournament score',
      },
      {
        method: 'POST',
        path: '/tournaments/:id/end',
        description: 'End a tournament',
      },
      {
        method: 'GET',
        path: '/tournaments/:id/rank/:userId',
        description: 'User rank in a tournament',
      },
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
      { method: 'GET', path: '/shows', description: 'List reality shows' },
      { method: 'GET', path: '/shows/current', description: 'Current reality show' },
      { method: 'GET', path: '/shows/live', description: 'Live reality show' },
      { method: 'GET', path: '/contestants', description: 'All contestants' },
      { method: 'GET', path: '/votes/quantity', description: 'Get vote quantities and pricing' },
      { method: 'POST', path: '/votes/quantity', description: 'Submit votes with quantity' },
      { method: 'POST', path: '/votes', description: 'Submit vote' },
      { method: 'POST', path: '/supervotes', description: 'Submit supervote' },
      { method: 'POST', path: '/predictions', description: 'Submit prediction' },
      { method: 'GET', path: '/predictions/:showId', description: 'Get prediction dashboard' },
      { method: 'GET', path: '/shows/:showId/episodes', description: 'List show episodes' },
      { method: 'GET', path: '/shows/:showId/contestants', description: 'List show contestants' },
      { method: 'GET', path: '/episodes/:episodeId', description: 'Get episode detail' },
      { method: 'GET', path: '/contestants/:contestantId', description: 'Get contestant detail' },
      // Reality live chat (reality.controller @Controller('reality'))
      { method: 'GET', path: '/live-chat/messages', description: 'Get live chat messages' },
      {
        method: 'GET',
        path: '/live-chat/participants',
        description: 'Get live chat participants',
      },
      { method: 'POST', path: '/live-chat/send', description: 'Send a live chat message' },
      // ---- Undeclared-surface ratchet pass (shows CRUD + analytics) ----
      { method: 'POST', path: '/shows', description: 'Create reality show' },
      { method: 'PUT', path: '/shows/:showId', description: 'Update reality show' },
      { method: 'DELETE', path: '/shows/:showId', description: 'Delete reality show' },
      {
        method: 'POST',
        path: '/shows/:showId/seasons',
        description: 'Create a season for a show',
      },
      {
        method: 'POST',
        path: '/shows/:showId/episodes',
        description: 'Create a show episode',
      },
      {
        method: 'PUT',
        path: '/episodes/:episodeId',
        description: 'Update an episode',
      },
      {
        method: 'DELETE',
        path: '/episodes/:episodeId',
        description: 'Delete an episode',
      },
      {
        method: 'POST',
        path: '/shows/:showId/contestants',
        description: 'Add a contestant to a show',
      },
      {
        method: 'PUT',
        path: '/contestants/:contestantId',
        description: 'Update a contestant',
      },
      {
        method: 'DELETE',
        path: '/contestants/:contestantId',
        description: 'Delete a contestant',
      },
      {
        method: 'GET',
        path: '/shows/:showId/analytics',
        description: 'Show analytics dashboard data',
      },
      {
        method: 'GET',
        path: '/shows/:showId/votes',
        description: 'List votes for a show',
      },
      {
        method: 'POST',
        path: '/shows/:showId/vote',
        description: 'Vote inside a show context',
      },
      {
        method: 'GET',
        path: '/shows/:showId/predictions',
        description: 'List predictions for a show',
      },
      {
        method: 'GET',
        path: '/shows/:showId/leaderboard',
        description: 'Show leaderboard',
      },
      {
        method: 'GET',
        path: '/shows/:showId/likes',
        description: 'Show like stats',
      },
      {
        method: 'POST',
        path: '/shows/:showId/like',
        description: 'Like a show',
      },
      {
        method: 'GET',
        path: '/shows/:showId/comments',
        description: 'List show comments',
      },
      {
        method: 'POST',
        path: '/shows/:showId/comments',
        description: 'Comment on a show',
      },
      {
        method: 'POST',
        path: '/shows/:showId/share',
        description: 'Record a show share',
      },
      {
        method: 'GET',
        path: '/shows/:showId/viewers',
        description: 'Show viewer stats',
      },
      {
        method: 'GET',
        path: '/shows/:showId/fraud/votes',
        description: 'Vote fraud assessment',
      },
      {
        method: 'GET',
        path: '/shows/:showId/fraud/supervotes',
        description: 'Supervote fraud assessment',
      },
      {
        method: 'GET',
        path: '/shows/:showId/fraud/predictions',
        description: 'Prediction fraud assessment',
      },
      {
        method: 'GET',
        path: '/shows/:showId/fraud/assessment',
        description: 'Overall fraud assessment',
      },
      {
        method: 'GET',
        path: '/votes/:voteId/audit',
        description: 'Vote audit trail',
      },
      { method: 'GET', path: '/clips', description: 'List reality clips' },
      { method: 'GET', path: '/featured', description: 'Featured reality content' },
      { method: 'GET', path: '/pricing', description: 'Vote/pricing configuration' },
      {
        method: 'GET',
        path: '/premium-extras',
        description: 'List premium extras',
      },
      {
        method: 'POST',
        path: '/premium-extras/:extraId/purchase',
        description: 'Purchase a premium extra',
      },
      {
        method: 'POST',
        path: '/rewards/:showId/confirm',
        description: 'Confirm show rewards payout',
      },
      { method: 'GET', path: '/wallet/balance', description: 'Reality wallet balance' },
      {
        method: 'GET',
        path: '/admin/dashboard',
        description: 'Reality admin dashboard',
      },
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
      { method: 'GET', path: '/rental', description: 'List rental movies' },
      { method: 'GET', path: '/passes/current', description: 'Get current cinema pass' },
      { method: 'POST', path: '/passes/subscribe', description: 'Subscribe to a cinema pass' },
      { method: 'GET', path: '/dbo/overview', description: 'Get Digital Box Office overview' },
      // ---- Undeclared-surface ratchet pass (passes, viewing windows, filmmakers) ----
      { method: 'DELETE', path: '/passes/cancel', description: 'Cancel a pass subscription' },
      {
        method: 'GET',
        path: '/passes/access/:movieId',
        description: 'Check pass access for a movie',
      },
      {
        method: 'GET',
        path: '/passes/user/subscriptions',
        description: 'Current-user pass subscriptions',
      },
      {
        method: 'GET',
        path: '/:movieId/viewing-windows',
        description: 'Viewing windows for a movie',
      },
      {
        method: 'POST',
        path: '/:movieId/viewing-windows',
        description: 'Create a viewing window',
      },
      {
        method: 'GET',
        path: '/viewing-windows/active',
        description: 'Active viewing windows',
      },
      {
        method: 'PUT',
        path: '/viewing-windows/:windowId',
        description: 'Update a viewing window',
      },
      {
        method: 'GET',
        path: '/filmmakers/projects',
        description: 'List filmmaker projects',
      },
      {
        method: 'POST',
        path: '/filmmakers/projects',
        description: 'Create a filmmaker project',
      },
      {
        method: 'GET',
        path: '/filmmakers/projects/:id',
        description: 'Filmmaker project detail',
      },
      {
        method: 'PATCH',
        path: '/filmmakers/projects/:id',
        description: 'Update a filmmaker project',
      },
      {
        method: 'GET',
        path: '/filmmakers/projects/:id/backers',
        description: 'Filmmaker project backers',
      },
      {
        method: 'POST',
        path: '/filmmakers/projects/:id/updates',
        description: 'Post a project update',
      },
      { method: 'POST', path: '/filmmakers/back', description: 'Back a filmmaker project' },
      {
        method: 'GET',
        path: '/genre/:slug/:page',
        description: 'Movies by genre and page',
      },
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
      { method: 'GET', path: '/home', description: 'Sports home' },
      { method: 'GET', path: '/categories', description: 'Sports categories' },
      { method: 'GET', path: '/live', description: 'Live sports' },
      { method: 'GET', path: '/live/scores', description: 'Live match scores' },
      { method: 'GET', path: '/live/match/:matchId', description: 'Live match details' },
      { method: 'GET', path: '/fixtures', description: 'Sports fixtures' },
      { method: 'GET', path: '/fixtures/:id', description: 'Fixture details' },
      { method: 'GET', path: '/upcoming', description: 'Upcoming fixtures' },
      { method: 'GET', path: '/highlights', description: 'Sports highlights' },
      // ---- Undeclared-surface ratchet pass (predictions detail, fan contests, fixtures admin) ----
      {
        method: 'GET',
        path: '/highlights/:id',
        description: 'Highlight detail',
      },
      { method: 'GET', path: '/predictions/:id', description: 'Prediction detail' },
      { method: 'GET', path: '/predictions/my', description: 'My predictions' },
      {
        method: 'GET',
        path: '/predictions/leaderboard',
        description: 'Prediction market leaderboard',
      },
      {
        method: 'POST',
        path: '/predictions/create',
        description: 'Create a prediction market',
      },
      {
        method: 'POST',
        path: '/predictions/:id/predict',
        description: 'Submit a prediction on a market',
      },
      {
        method: 'POST',
        path: '/predictions/:id/settle',
        description: 'Settle a prediction market',
      },
      { method: 'GET', path: '/fan-contests/:id', description: 'Fan contest detail' },
      {
        method: 'GET',
        path: '/fan-contests/:id/leaderboard',
        description: 'Fan contest leaderboard',
      },
      {
        method: 'GET',
        path: '/fan-contests/:id/rank/:userId',
        description: 'User rank in a fan contest',
      },
      {
        method: 'POST',
        path: '/fan-contests/:id/score',
        description: 'Score a fan contest entry',
      },
      {
        method: 'POST',
        path: '/fan-contests/:id/end',
        description: 'End a fan contest',
      },
      {
        method: 'POST',
        path: '/fixtures/:id/metadata',
        description: 'Attach metadata to a fixture',
      },
      {
        method: 'POST',
        path: '/fixtures/:id/result',
        description: 'Record a fixture result',
      },
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
      // ---- Undeclared-surface ratchet pass (queue ops surface) ----
      { method: 'GET', path: '/stats', description: 'Aggregate queue stats' },
      { method: 'GET', path: '/:queue/jobs', description: 'List jobs in a queue' },
      {
        method: 'GET',
        path: '/:queue/jobs/delayed',
        description: 'List delayed jobs',
      },
      {
        method: 'GET',
        path: '/:queue/jobs/failed',
        description: 'List failed jobs',
      },
      { method: 'GET', path: '/:queue/jobs/:jobId', description: 'Job detail' },
      {
        method: 'POST',
        path: '/:queue/jobs/:jobId/retry',
        description: 'Retry a job',
      },
      {
        method: 'DELETE',
        path: '/:queue/jobs/:jobId',
        description: 'Remove a job',
      },
      { method: 'POST', path: '/:queue/clean', description: 'Clean a queue' },
      { method: 'POST', path: '/:queue/pause', description: 'Pause a queue' },
      { method: 'POST', path: '/:queue/resume', description: 'Resume a queue' },
      {
        method: 'POST',
        path: '/:queue/retry-all-failed',
        description: 'Retry all failed jobs in a queue',
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
      { method: 'GET', path: '/events', description: 'Lifestyle events' },
      { method: 'GET', path: '/events/:id', description: 'Event details' },
      { method: 'GET', path: '/music', description: 'Lifestyle music' },
      { method: 'GET', path: '/music/trending', description: 'Trending music' },
      { method: 'GET', path: '/music/genres', description: 'Music genres' },
      { method: 'GET', path: '/influencers', description: 'Lifestyle influencers' },
      { method: 'GET', path: '/influencers/:id', description: 'Influencer details' },
      { method: 'GET', path: '/celebrities', description: 'Lifestyle celebrities' },
      { method: 'GET', path: '/celebrities/:id', description: 'Celebrity details' },
      // Music detail routes (music.controller @Controller('lifestyle/music'))
      { method: 'GET', path: '/music/artists/:id', description: 'Artist details' },
      { method: 'GET', path: '/music/genres/:slug', description: 'Genre details' },
      // City guide (city-guide.controller @Controller('lifestyle/city-guide'))
      { method: 'GET', path: '/city-guide', description: 'City guide entries' },
      {
        method: 'GET',
        path: '/city-guide/featured',
        description: 'Featured city guide entries',
      },
      { method: 'GET', path: '/city-guide/search', description: 'Search city guide entries' },
      { method: 'GET', path: '/city-guide/tags', description: 'City guide tags' },
      {
        method: 'GET',
        path: '/city-guide/:slug',
        description: 'City guide entry by slug',
      },
      // Event RSVP + attendees (events.controller @Controller('lifestyle/events'))
      { method: 'POST', path: '/events/:id/rsvp', description: 'RSVP to an event' },
      {
        method: 'DELETE',
        path: '/events/:id/rsvp',
        description: 'Cancel event RSVP',
      },
      { method: 'GET', path: '/events/:id/attendees', description: 'Get event attendees' },
      // Lifestyle guides (guides.controller @Controller('lifestyle'))
      { method: 'GET', path: '/itineraries', description: 'List published itineraries' },
      { method: 'GET', path: '/itineraries/:id', description: 'Itinerary details with stops' },
      { method: 'GET', path: '/neighborhoods', description: 'List published neighborhoods' },
      {
        method: 'GET',
        path: '/neighborhoods/:id',
        description: 'Neighborhood details with places',
      },
      { method: 'GET', path: '/partners', description: 'List published partners' },
      { method: 'GET', path: '/partners/:id', description: 'Partner details with active offers' },
      { method: 'GET', path: '/offers', description: 'List active offers' },
      { method: 'GET', path: '/offers/:id', description: 'Offer details with partner' },
      // Guides admin CRUD (guides-admin.controller @Controller('lifestyle/admin'))
      {
        method: 'GET',
        path: '/admin/itineraries',
        description: 'List itineraries, all statuses (admin)',
      },
      {
        method: 'POST',
        path: '/admin/itineraries',
        description: 'Create itinerary with stops (admin)',
      },
      { method: 'PATCH', path: '/admin/itineraries/:id', description: 'Update itinerary (admin)' },
      { method: 'DELETE', path: '/admin/itineraries/:id', description: 'Delete itinerary (admin)' },
      {
        method: 'GET',
        path: '/admin/neighborhoods',
        description: 'List neighborhoods, all statuses (admin)',
      },
      {
        method: 'POST',
        path: '/admin/neighborhoods',
        description: 'Create neighborhood with places (admin)',
      },
      {
        method: 'PATCH',
        path: '/admin/neighborhoods/:id',
        description: 'Update neighborhood (admin)',
      },
      {
        method: 'DELETE',
        path: '/admin/neighborhoods/:id',
        description: 'Delete neighborhood (admin)',
      },
      {
        method: 'GET',
        path: '/admin/partners',
        description: 'List partners, all statuses (admin)',
      },
      { method: 'POST', path: '/admin/partners', description: 'Create partner (admin)' },
      { method: 'PATCH', path: '/admin/partners/:id', description: 'Update partner (admin)' },
      {
        method: 'DELETE',
        path: '/admin/partners/:id',
        description: 'Delete partner, cascades offers (admin)',
      },
      {
        method: 'POST',
        path: '/admin/partners/:partnerId/offers',
        description: 'Create offer under partner (admin)',
      },
      { method: 'PATCH', path: '/admin/offers/:id', description: 'Update offer (admin)' },
      { method: 'DELETE', path: '/admin/offers/:id', description: 'Delete offer (admin)' },
      { method: 'GET', path: '/nightlife', description: 'Lifestyle nightlife' },
      // ---- Undeclared-surface ratchet pass (writer + social + feed) ----
      { method: 'POST', path: '/celebrities', description: 'Create celebrity profile' },
      { method: 'PATCH', path: '/celebrities/:id', description: 'Update celebrity profile' },
      { method: 'DELETE', path: '/celebrities/:id', description: 'Delete celebrity profile' },
      {
        method: 'GET',
        path: '/celebrities/:celebrityId/news',
        description: 'Celebrity news list',
      },
      { method: 'POST', path: '/celebrities/news', description: 'Create celebrity news item' },
      { method: 'POST', path: '/city-guide', description: 'Create city guide entry' },
      { method: 'PATCH', path: '/city-guide/:id', description: 'Update city guide entry' },
      { method: 'DELETE', path: '/city-guide/:id', description: 'Delete city guide entry' },
      { method: 'POST', path: '/events', description: 'Create lifestyle event' },
      { method: 'PATCH', path: '/events/:id', description: 'Update lifestyle event' },
      { method: 'DELETE', path: '/events/:id', description: 'Delete lifestyle event' },
      { method: 'POST', path: '/influencers', description: 'Create influencer profile' },
      { method: 'PATCH', path: '/influencers/:id', description: 'Update influencer profile' },
      {
        method: 'DELETE',
        path: '/influencers/:id',
        description: 'Delete influencer profile',
      },
      {
        method: 'GET',
        path: '/influencers/:influencerId/collaborations',
        description: 'Influencer collaborations',
      },
      {
        method: 'POST',
        path: '/influencers/collaborations',
        description: 'Create influencer collaboration',
      },
      { method: 'POST', path: '/music', description: 'Create music entry' },
      { method: 'PATCH', path: '/music/:id', description: 'Update music entry' },
      { method: 'DELETE', path: '/music/:id', description: 'Delete music entry' },
      { method: 'POST', path: '/nightlife', description: 'Create nightlife entry' },
      {
        method: 'GET',
        path: '/nightlife/featured',
        description: 'Featured nightlife entries',
      },
      { method: 'GET', path: '/nightlife/:slug', description: 'Nightlife entry by slug' },
      { method: 'PATCH', path: '/nightlife/:id', description: 'Update nightlife entry' },
      { method: 'DELETE', path: '/nightlife/:id', description: 'Delete nightlife entry' },
      { method: 'POST', path: '/social/save', description: 'Save lifestyle content' },
      { method: 'DELETE', path: '/social/save', description: 'Unsave lifestyle content' },
      { method: 'GET', path: '/social/saved', description: 'List saved lifestyle content' },
      {
        method: 'GET',
        path: '/social/saved/check',
        description: 'Check whether content is saved',
      },
      { method: 'POST', path: '/social/share', description: 'Record a content share' },
      {
        method: 'GET',
        path: '/social/share/count',
        description: 'Share count for content',
      },
      { method: 'GET', path: '/feed', description: 'Lifestyle feed' },
      { method: 'GET', path: '/feed/trending', description: 'Trending lifestyle feed' },
      { method: 'GET', path: '/stories', description: 'Lifestyle stories' },
      {
        method: 'GET',
        path: '/stories/categories',
        description: 'Lifestyle story categories',
      },
      { method: 'GET', path: '/stories/:slug', description: 'Lifestyle story by slug' },
      { method: 'POST', path: '/stories', description: 'Create lifestyle story' },
      { method: 'PATCH', path: '/stories/:id', description: 'Update lifestyle story' },
      { method: 'DELETE', path: '/stories/:id', description: 'Delete lifestyle story' },
      {
        method: 'POST',
        path: '/stories/:id/view',
        description: 'Record a story view',
      },
      {
        method: 'GET',
        path: '/admin/itineraries/:id',
        description: 'Itinerary detail, all statuses (admin)',
      },
      {
        method: 'GET',
        path: '/admin/neighborhoods/:id',
        description: 'Neighborhood detail, all statuses (admin)',
      },
      {
        method: 'GET',
        path: '/admin/offers/:id',
        description: 'Offer detail, all statuses (admin)',
      },
      {
        method: 'GET',
        path: '/admin/partners/:id',
        description: 'Partner detail, all statuses (admin)',
      },
      {
        method: 'GET',
        path: '/admin/partners/:partnerId/offers',
        description: 'Offers under a partner (admin)',
      },
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
      { method: 'GET', path: '/characters', description: 'Vertical characters' },
      { method: 'GET', path: '/characters/:slug', description: 'Character details' },
      { method: 'GET', path: '/characters/:slug/relationships', description: 'Character relationships' },
      { method: 'GET', path: '/storyworlds', description: 'Vertical storyworlds' },
      { method: 'GET', path: '/storyworlds/:slug', description: 'Storyworld details' },
      {
        method: 'GET',
        path: '/storyworlds/:slug/titles',
        description: 'Storyworld titles',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/characters',
        description: 'Storyworld characters',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/theories',
        description: 'Storyworld theories',
      },
      {
        method: 'POST',
        path: '/storyworlds/:slug/theories',
        description: 'Submit a storyworld theory',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/realms',
        description: 'Storyworld realms',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/orisa',
        description: 'Storyworld orisa files',
      },
      { method: 'GET', path: '/crossovers', description: 'Vertical crossovers' },
      { method: 'GET', path: '/crossovers/recaps', description: 'Crossover recaps' },
      {
        method: 'GET',
        path: '/crossovers/recaps/:id',
        description: 'Crossover recap detail',
      },
      { method: 'POST', path: '/crossovers', description: 'Create crossover' },
      { method: 'POST', path: '/crossovers/recaps', description: 'Create crossover recap' },
      { method: 'GET', path: '/crossovers/:slug', description: 'Crossover details' },
      { method: 'GET', path: '/lore', description: 'Vertical lore' },
      { method: 'GET', path: '/lore/categories', description: 'Lore categories' },
      { method: 'GET', path: '/lore/:slug', description: 'Lore details' },
      { method: 'POST', path: '/lore', description: 'Create lore entry' },
      { method: 'PATCH', path: '/lore/:id', description: 'Update lore entry' },
      { method: 'DELETE', path: '/lore/:id', description: 'Delete lore entry' },
      { method: 'GET', path: '/timeline', description: 'Vertical timeline' },
      { method: 'GET', path: '/timeline/upcoming', description: 'Upcoming timeline events' },
      {
        method: 'GET',
        path: '/timeline/event/:id',
        description: 'Timeline event detail',
      },
      { method: 'POST', path: '/timeline', description: 'Create timeline event' },
      // Titles family (titles.controller @Controller('vertical/titles'))
      { method: 'GET', path: '/titles', description: 'List titles' },
      { method: 'GET', path: '/titles/featured', description: 'Featured titles' },
      { method: 'GET', path: '/titles/:slug', description: 'Title details' },
      {
        method: 'GET',
        path: '/titles/:slug/episodes',
        description: 'Title episodes (chapters)',
      },
      {
        method: 'GET',
        path: '/titles/:slug/characters',
        description: 'Title universe characters',
      },
      {
        method: 'GET',
        path: '/titles/:slug/related',
        description: 'Related titles (same universe)',
      },
      { method: 'POST', path: '/titles', description: 'Create title' },
      { method: 'PATCH', path: '/titles/:id', description: 'Update title' },
      { method: 'DELETE', path: '/titles/:id', description: 'Delete title' },
      {
        method: 'POST',
        path: '/titles/:titleId/chapters',
        description: 'Create title chapter',
      },
      {
        method: 'GET',
        path: '/titles/:titleId/chapters/:number',
        description: 'Get chapter by number',
      },
      // ---- Undeclared-surface ratchet pass (universes, agbala, storyworld extras) ----
      { method: 'GET', path: '/universes', description: 'List universes' },
      { method: 'GET', path: '/universes/featured', description: 'Featured universes' },
      { method: 'GET', path: '/universes/categories', description: 'Universe categories' },
      { method: 'GET', path: '/universes/genres', description: 'Universe genres' },
      { method: 'GET', path: '/universes/locations', description: 'Universe locations' },
      {
        method: 'GET',
        path: '/universes/locations/:slug',
        description: 'Universe location detail',
      },
      { method: 'POST', path: '/universes/locations', description: 'Create universe location' },
      {
        method: 'PATCH',
        path: '/universes/locations/:id',
        description: 'Update universe location',
      },
      { method: 'GET', path: '/universes/map/:slug', description: 'Universe world map' },
      { method: 'POST', path: '/characters', description: 'Create character' },
      { method: 'PATCH', path: '/characters/:id', description: 'Update character' },
      {
        method: 'POST',
        path: '/characters/:id/relationships',
        description: 'Create character relationship',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/artifacts',
        description: 'Storyworld artifacts',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/maps',
        description: 'Storyworld maps',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/prophecies',
        description: 'Storyworld prophecies',
      },
      {
        method: 'GET',
        path: '/storyworlds/:slug/rooms',
        description: 'Storyworld rooms',
      },
      {
        method: 'POST',
        path: '/storyworlds/:slug/rooms/:roomId/posts',
        description: 'Post to a storyworld room',
      },
      {
        method: 'POST',
        path: '/storyworlds/:slug/unlock',
        description: 'Unlock a storyworld',
      },
      {
        method: 'GET',
        path: '/agbala/storyworlds',
        description: 'Agbala storyworld listing',
      },
      {
        method: 'GET',
        path: '/agbala/storyworlds/:storyworldId',
        description: 'Agbala storyworld detail',
      },
      {
        method: 'GET',
        path: '/agbala/storyworlds/:storyworldId/characters',
        description: 'Agbala storyworld characters',
      },
      {
        method: 'GET',
        path: '/agbala/storyworlds/:storyworldId/paths',
        description: 'Agbala storyworld paths',
      },
      {
        method: 'POST',
        path: '/agbala/storyworlds/:storyworldId/paths',
        description: 'Create agbala path (admin)',
      },
      { method: 'GET', path: '/agbala/quizzes', description: 'Agbala quizzes' },
      { method: 'POST', path: '/agbala/quizzes', description: 'Create agbala quiz (admin)' },
      {
        method: 'DELETE',
        path: '/agbala/quizzes/:id',
        description: 'Delete agbala quiz (admin)',
      },
      {
        method: 'PATCH',
        path: '/agbala/paths/:id',
        description: 'Update agbala path (admin)',
      },
      {
        method: 'DELETE',
        path: '/agbala/paths/:id',
        description: 'Delete agbala path (admin)',
      },
      {
        method: 'GET',
        path: '/agbala/moderation/review-queue',
        description: 'Agbala moderation review queue',
      },
      {
        method: 'POST',
        path: '/agbala/moderation/:contentId/approve',
        description: 'Approve an agbala moderation item',
      },
      {
        method: 'POST',
        path: '/agbala/moderation/:contentId/reject',
        description: 'Reject an agbala moderation item',
      },
      { method: 'GET', path: '/admin/stats', description: 'Vertical service stats (admin)' },
      { method: 'GET', path: '/admin/titles', description: 'All titles, all statuses (admin)' },
      {
        method: 'GET',
        path: '/admin/characters',
        description: 'All characters, all statuses (admin)',
      },
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
    envKey: 'LIFESTYLE_SERVICE_URL',
    fallbackUrl: 'http://lifestyle-service:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List challenges (supports ?status=active)' },
      { method: 'POST', path: '/', description: 'Create challenge' },
      { method: 'GET', path: '/:id', description: 'Get challenge details' },
      {
        method: 'POST',
        path: '/:id/submit',
        description: 'Submit an entry to a challenge',
      },
      {
        method: 'POST',
        path: '/submissions/:id/vote',
        description: 'Vote for a challenge submission',
      },
    ],
  },
  {
    path: '/participation',
    envKey: 'LIFESTYLE_SERVICE_URL',
    fallbackUrl: 'http://lifestyle-service:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      {
        method: 'GET',
        path: '/:id/result',
        description: 'Unified poll or quiz attempt result',
      },
    ],
  },
  {
    path: '/polls',
    envKey: 'LIFESTYLE_SERVICE_URL',
    fallbackUrl: 'http://lifestyle-service:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List polls' },
      { method: 'GET', path: '/:id', description: 'Get poll details' },
      { method: 'POST', path: '/', description: 'Create a poll' },
      { method: 'POST', path: '/:id/vote', description: 'Vote in a poll' },
    ],
  },
  {
    path: '/quizzes',
    envKey: 'LIFESTYLE_SERVICE_URL',
    fallbackUrl: 'http://lifestyle-service:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/', description: 'List quizzes' },
      { method: 'GET', path: '/:id', description: 'Get quiz details' },
      { method: 'POST', path: '/', description: 'Create a quiz' },
      {
        method: 'POST',
        path: '/:id/start',
        description: 'Start a quiz attempt',
      },
      {
        method: 'POST',
        path: '/attempts/:attemptId/submit',
        description: 'Submit a quiz attempt',
      },
      {
        method: 'GET',
        path: '/:id/leaderboard',
        description: 'Get quiz leaderboard',
      },
    ],
  },
  {
    path: '/tipping',
    envKey: 'CREATOR_SERVICE_URL',
    fallbackUrl: 'http://creator-service:3018',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    endpoints: [
      { method: 'GET', path: '/stats', description: 'Get user tipping stats' },
      { method: 'GET', path: '/history', description: 'Get user tipping history' },
      { method: 'POST', path: '/send', description: 'Send a tip to a creator' },
    ],
  },
  {
    path: '/knowledge',
    envKey: 'KNOWLEDGE_SERVICE_URL',
    // AUD-04 fix: knowledge-service listens on 3020 — 3028 is support-service.
    // This fallback is live in docker-compose.prod.yml (no *_SERVICE_URL keys
    // are set there), so the wrong port meant every /knowledge request 502'd
    // the moment the route was enabled.
    fallbackUrl: 'http://knowledge-service:3020',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'default',
    isNew: true,
    endpoints: [
      // knowledge.controller @Controller('knowledge')
      { method: 'POST', path: '/events', description: 'Create canonical event' },
      { method: 'GET', path: '/events/:id', description: 'Get canonical event' },
      {
        method: 'PATCH',
        path: '/events/:id/supersede',
        description: 'Supersede canonical event version',
      },
      { method: 'POST', path: '/units', description: 'Create knowledge unit' },
      { method: 'GET', path: '/units/:id', description: 'Get knowledge unit' },
      { method: 'POST', path: '/units/:id/correct', description: 'Correct a knowledge unit' },
      { method: 'POST', path: '/grants', description: 'Grant knowledge to a user' },
      { method: 'GET', path: '/users/:userId/grants', description: 'List user knowledge grants' },
      { method: 'GET', path: '/users/:userId/known-ids', description: 'List known unit IDs' },
      {
        method: 'GET',
        path: '/users/:userId/projection',
        description: 'Get knowledge projection',
      },
      {
        method: 'POST',
        path: '/users/:userId/projection/rebuild',
        description: 'Rebuild knowledge projection',
      },
      { method: 'POST', path: '/equivalence-sets', description: 'Create equivalence set' },
      {
        method: 'GET',
        path: '/equivalence-sets/:setCode',
        description: 'Get equivalence set',
      },
      { method: 'POST', path: '/checkpoints', description: 'Create content checkpoint' },
      { method: 'POST', path: '/checkpoints/:id/trigger', description: 'Trigger a checkpoint' },
      { method: 'POST', path: '/spoiler-filter', description: 'Filter units by spoiler level' },
      // AOU reader screens
      { method: 'GET', path: '/summary', description: 'Knowledge progress summary' },
      {
        method: 'GET',
        path: '/what-you-know',
        description: 'Per-unit knowledge view',
      },
      { method: 'GET', path: '/locked', description: 'Locked knowledge view' },
    ],
  },
];
@ApiTags('Gateway')
@Controller('api')
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
    // AUD-21: was 30000 — a hung upstream pinned gateway workers for 30s per
    // request. 5s fails fast; raise per-deployment via UPSTREAM_TIMEOUT for
    // known-slow routes (the value flows straight into the breaker budget).
    this.UPSTREAM_TIMEOUT = this.configService.get<number>('UPSTREAM_TIMEOUT', 5000);
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

  /**
   * Deny-by-default endpoint allowlist check. The sub-path is what follows
   * the service prefix (e.g. 'balance' for /api/v1/wallet/balance), so a
   * leading version segment is stripped for legacy unversioned URLs
   * (/api/wallet/v1/balance). Declared ':param' segments match any
   * non-empty segment. Routes without an endpoints manifest stay open.
   */
  private isDeclaredEndpoint(route: ServiceRoute, method: string, subPath: string): boolean {
    if (!route.endpoints || route.endpoints.length === 0) {
      return true;
    }
    const requestSegments = (subPath || '').split('/').filter(Boolean);
    if (requestSegments.length > 0 && /^v\d+$/.test(requestSegments[0])) {
      requestSegments.shift();
    }
    return route.endpoints.some((ep) => {
      if (ep.method.toUpperCase() !== method.toUpperCase()) {
        return false;
      }
      const declaredSegments = ep.path.split('/').filter(Boolean);
      if (declaredSegments.length !== requestSegments.length) {
        return false;
      }
      return declaredSegments.every((seg, i) =>
        seg.startsWith(':') ? requestSegments[i].length > 0 : seg === requestSegments[i]
      );
    });
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
      // Analytics endpoints are read by the admin panel right after it
      // mutates the underlying intelligence data (agent registry, task
      // classifications, capacity ledger, risk approvals, reports) — caching
      // any of them for 5min made every mutation appear to silently revert
      // (the next list kept serving pre-mutation bytes until TTL expired).
      // Exclude the whole /analytics/ subtree: same bug class the /admin/
      // exclusion already fixed, and per-endpoint lists kept missing the
      // endpoints added later.
      '/analytics/',
      // Bundle passes are CRUD-managed from the admin panel; a cached list
      // served the pre-delete body after a successful DELETE.
      '/subscription/bundles',
    ];
    return userSpecificPatterns.some((pattern) => path.includes(pattern));
  }

  /**
   * Does this request carry credentials (Bearer token or session cookie)?
   *
   * The response cache is deny-by-default and never caches anything for an
   * authenticated caller: a shared cached body must never be able to serve
   * one user another user's data (identity comes in many forms — Bearer
   * header, httpOnly session cookie, or x-user-* headers stamped by the
   * auth gateway), and authenticated reads are frequently re-issued right
   * after a mutation, where any TTL would make the write appear to revert.
   * Only explicitly-marked public routes, called anonymously, are eligible.
   */
  private isAuthenticatedRequest(req: Request): boolean {
    if (req.headers.authorization) return true;
    if (req.headers.cookie) return true;
    const authUser = (req as Request & { user?: unknown }).user;
    return authUser !== undefined && authUser !== null;
  }

  private async proxyRequest(
    method: string,
    version: string,
    service: string,
    subPath: string,
    req: Request,
    res: Response
  ): Promise<void> {
    let requestId = (req.headers[this.REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();
    if (requestId && !/^[a-zA-Z0-9\-]{1,128}$/.test(requestId)) {
      requestId = randomUUID();
    }

    // Global kill-switch: gateway_maintenance_mode returns 503 for all traffic.
    const [maintenanceMode, apiV2Enabled, responseCacheEnabled, endpointEnforcement] =
      await Promise.all([
        this.featureFlagService.isEnabled(gatewayFlags.maintenanceMode),
        this.featureFlagService.isEnabled(gatewayFlags.apiV2),
        this.featureFlagService.isEnabled(gatewayFlags.responseCache),
        this.featureFlagService.isEnabled(gatewayFlags.endpointEnforcement),
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

    // Deny-by-default endpoint allowlist (gateway_endpoint_enforcement,
    // default off): only method+path pairs declared in the route's endpoints
    // manifest are forwarded upstream.
    if (endpointEnforcement && !this.isDeclaredEndpoint(route, method, subPath)) {
      res.setHeader(this.REQUEST_ID_HEADER, requestId);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Endpoint not found' });
      return;
    }

    const cacheKey = this.buildCacheKey(req, version);

    // Admin-panel data must always be live: the 5-minute GET cache made every
    // admin mutation appear to revert (the next list kept serving
    // pre-mutation bytes until TTL expired — toggles, edits, suspensions all
    // looked like they silently undid themselves). Never cache admin traffic.
    // Same applies to user-specific endpoints (e.g. /creator/*): a PUT followed
    // by a GET within the TTL served the pre-mutation body, so saved settings
    // appeared to revert. Never cache per-user data.
    const isAdminPath = (req.path || req.url || '').includes('/admin/');
    const isUserSpecificPath = this.isUserSpecificEndpoint(req.path || req.url || '');

    // Deny-by-default cache eligibility: the route must explicitly opt in
    // (publicCacheable), and an authenticated caller is never served a
    // shared cached body (see isAuthenticatedRequest). The path exclusions
    // below remain as defense in depth for routes that predate the flag.
    const routeAllowsCache = route.publicCacheable === true;
    const requestIsAuthenticated = this.isAuthenticatedRequest(req);

    if (
      method === 'GET' &&
      responseCacheEnabled &&
      routeAllowsCache &&
      !requestIsAuthenticated &&
      !isAdminPath &&
      !isUserSpecificPath
    ) {
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
      const body = response as Record<string, unknown>;
      // Never cache responses the client will treat as data: bodies with
      // success:false AND bare error bodies (no `success` field at all — e.g.
      // the circuit breaker's {message, retryAfter, circuitState} 503). The
      // old success-only check cached circuit-open bodies for the full TTL,
      // so an admin page kept 503ing for 5 minutes after the backend healed.
      const isWrapperError = body.success === false;
      const isBareError =
        !('success' in body) &&
        (typeof body.circuitState === 'string' ||
          typeof body.message === 'string' ||
          body.statusCode !== undefined);
      if (
        responseCacheEnabled &&
        routeAllowsCache &&
        !requestIsAuthenticated &&
        !isAdminPath &&
        !isUserSpecificPath &&
        !isWrapperError &&
        !isBareError
      ) {
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
      const role = user?.role ? String(user.role).toLowerCase().replace(/[-_]/g, '') : '';
      const hasAdminAccess = role === 'admin' || role === 'superadmin';
      if (!user || !hasAdminAccess) {
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
        // The shared http-client auto-generates this on POSTs; downstream
        // wallet/payment idempotency depends on it surviving the proxy hop.
        'idempotency-key',
      ];

      for (const key of ALLOWED_HEADERS) {
        const value = req.headers[key];
        if (typeof value === 'string') {
          headers[key] = value;
        }
      }

      // SECURITY (AUD-01): Only forward identity headers if verified by GatewayAuthGuard
      // Never trust client-supplied x-user-* headers on unauthenticated or public paths.
      const verifiedUser = (req as Request & { user?: { sub?: string; id?: string; email?: string; role?: string } }).user;
      if (verifiedUser && typeof verifiedUser === 'object') {
        const uid = verifiedUser.sub || verifiedUser.id;
        if (uid) headers['x-user-id'] = uid;
        if (verifiedUser.email) headers['x-user-email'] = verifiedUser.email;
        if (verifiedUser.role) headers['x-user-role'] = verifiedUser.role;
      } else {
        delete headers['x-user-id'];
        delete headers['x-user-email'];
        delete headers['x-user-role'];
      }

      // Inject gateway secret so downstream ServiceAuthGuard trusts verified x-user-* headers
      const gatewaySecret = this.configService.get<string>('GATEWAY_SECRET');
      if (gatewaySecret) {
        headers['x-gateway-secret'] = gatewaySecret;
      }

      // Forward the client's cookie header so cookie-only SPA flows work
      // (e.g. POST /auth/refresh from the admin/creator panels, which send the
      // refresh_token httpOnly cookie instead of a JSON body).
      if (req.headers.cookie) {
        headers['cookie'] = req.headers.cookie;
      }

      const cleanTargetPath = targetPath.split('?')[0];

      // Multipart bodies are captured raw by RawBodyCaptureMiddleware —
      // forward those verbatim so the upstream's multer sees the original
      // multipart stream with its boundary intact.
      const upstreamBody =
        (req as RawBodyRequest).rawBody !== undefined ? (req as RawBodyRequest).rawBody : req.body;

      const proxyResponse = await this.circuitBreakerProxyService.proxyRequest({
        serviceName: service,
        method: req.method,
        targetUrl,
        path: cleanTargetPath,
        headers,
        body: upstreamBody,
        queryString: queryString || undefined,
        timeout: this.UPSTREAM_TIMEOUT,
        requestId,
      });

      const skipHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'content-encoding'];

      for (const [key, value] of Object.entries(proxyResponse.headers)) {
        // set-cookie carries newline-joined values from the proxy service
        // (multiple cookies per response); Express requires append(), not
        // set(), or every cookie after the first is lost.
        if (key.toLowerCase() === 'set-cookie') {
          for (const cookie of String(value).split('\n')) {
            if (cookie) res.append('Set-Cookie', cookie);
          }
          continue;
        }
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      }
      res.setHeader(API_VERSION_HEADER, version);
      res.setHeader(this.REQUEST_ID_HEADER, requestId);

      // Forward the upstream status verbatim: collapsing unknown statuses
      // (3xx, 410, 413, 451, …) into 200 OK corrupts client retry/cache logic.
      res.status(proxyResponse.status);

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
