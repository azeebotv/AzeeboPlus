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
import { ApiVersioningConfig, API_VERSION_HEADER, DEFAULT_API_VERSION } from '@azeebo/shared-types';
import { randomUUID } from 'crypto';

interface Endpoint {
  method: string;
  path: string;
  description: string;
}

interface ServiceRoute {
  path: string;
  targetUrl: string;
  supportedVersions: string[];
  defaultVersion: string;
  endpoints?: Endpoint[];
}

export const SERVICE_ROUTES: ServiceRoute[] = [
  {
    path: '/auth',
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
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
      { method: 'POST', path: '/social/google', description: 'Google OAuth login' },
      { method: 'POST', path: '/social/apple', description: 'Apple OAuth login' },
      { method: 'POST', path: '/social/unlink', description: 'Unlink social account' },
      { method: 'POST', path: '/otp/send', description: 'Send OTP' },
      { method: 'POST', path: '/otp/verify', description: 'Verify OTP' },
    ],
  },
  {
    path: '/users',
    targetUrl: process.env.USER_SERVICE_URL || 'http://user-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/me', description: 'Get current user profile' },
      { method: 'PATCH', path: '/me', description: 'Update current user profile' },
      { method: 'GET', path: '/me/preferences', description: 'Get user preferences' },
      { method: 'PATCH', path: '/me/preferences', description: 'Update user preferences' },
      { method: 'GET', path: '/me/history', description: 'Get viewing history' },
      { method: 'GET', path: '/me/saved', description: 'Get saved content' },
      { method: 'POST', path: '/me/saved', description: 'Save content' },
      { method: 'DELETE', path: '/me/saved/:contentId', description: 'Remove saved content' },
      { method: 'GET', path: '/me/universe-affinity', description: 'Get universe affinity' },
      { method: 'PATCH', path: '/me/universe-affinity', description: 'Update universe affinity' },
      { method: 'GET', path: '/:id', description: 'Get user by ID' },
      { method: 'GET', path: '/:id/content', description: 'Get user\'s content' },
      { method: 'POST', path: '/:id/follow', description: 'Follow a user' },
      { method: 'DELETE', path: '/:id/follow', description: 'Unfollow a user' },
      { method: 'GET', path: '/:id/followers', description: 'Get user\'s followers' },
      { method: 'GET', path: '/:id/following', description: 'Get users being followed' },
    ],
  },
  {
    path: '/wallet',
    targetUrl: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get current user\'s wallet' },
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
    targetUrl: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/initialize', description: 'Initialize payment' },
      { method: 'POST', path: '/verify', description: 'Verify payment' },
      { method: 'GET', path: '/history', description: 'Get payment history' },
      { method: 'POST', path: '/webhook', description: 'Payment provider webhook' },
      { method: 'POST', path: '/refund-request', description: 'Request refund' },
      { method: 'POST', path: '/webhooks/paystack', description: 'Paystack webhook' },
      { method: 'POST', path: '/webhooks/flutterwave', description: 'Flutterwave webhook' },
      { method: 'GET', path: '/:id', description: 'Get payment details' },
    ],
  },
  {
    path: '/content',
    targetUrl: process.env.CONTENT_SERVICE_URL || 'http://content-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'List content (with filters)' },
      { method: 'GET', path: '/:id', description: 'Get content details' },
      { method: 'POST', path: '/', description: 'Create content (creators)' },
      { method: 'PATCH', path: '/:id', description: 'Update content' },
      { method: 'DELETE', path: '/:id', description: 'Delete content' },
      { method: 'GET', path: '/:id/comments', description: 'Get content comments' },
      { method: 'POST', path: '/:id/comments', description: 'Add comment' },
      { method: 'GET', path: '/:id/analytics', description: 'Get content analytics' },
    ],
  },
  {
    path: '/notifications',
    targetUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'List notifications' },
      { method: 'PATCH', path: '/:id/read', description: 'Mark as read' },
      { method: 'PATCH', path: '/read-all', description: 'Mark all as read' },
      { method: 'GET', path: '/settings', description: 'Get notification settings' },
      { method: 'PATCH', path: '/settings', description: 'Update settings' },
    ],
  },
  {
    path: '/rewards',
    targetUrl: process.env.REWARD_SERVICE_URL || 'http://reward-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/account', description: 'Get reward account' },
      { method: 'POST', path: '/earn', description: 'Record reward activity' },
      { method: 'GET', path: '/balance', description: 'Get points balance' },
      { method: 'GET', path: '/history', description: 'Get reward history' },
      { method: 'POST', path: '/redeem', description: 'Redeem rewards' },
    ],
  },
  {
    path: '/search',
    targetUrl: process.env.SEARCH_SERVICE_URL || 'http://search-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Search content' },
      { method: 'GET', path: '/suggestions', description: 'Get search suggestions' },
      { method: 'GET', path: '/trending', description: 'Get trending searches' },
    ],
  },
  {
    path: '/analytics',
    targetUrl: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/events', description: 'Track events' },
      { method: 'GET', path: '/funnels', description: 'Get funnel analytics' },
      { method: 'GET', path: '/cohorts', description: 'Get cohort analytics' },
      { method: 'GET', path: '/kpis', description: 'Get universe KPIs' },
      { method: 'GET', path: '/realtime', description: 'Get realtime stats' },
    ],
  },
  {
    path: '/recommendations',
    targetUrl: process.env.RECOMMENDATION_SERVICE_URL || 'http://recommendation-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/content', description: 'Get content recommendations' },
      { method: 'GET', path: '/creators', description: 'Get creator recommendations' },
      { method: 'GET', path: '/cross-universe', description: 'Get cross-universe recommendations' },
      { method: 'GET', path: '/trending', description: 'Get trending content' },
    ],
  },
  {
    path: '/creators',
    targetUrl: process.env.CREATOR_SERVICE_URL || 'http://creator-service:3018',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/onboard', description: 'Start creator onboarding' },
      { method: 'GET', path: '/me', description: 'Get current creator profile' },
      { method: 'PATCH', path: '/me', description: 'Update creator profile' },
      { method: 'GET', path: '/dashboard', description: 'Get creator dashboard' },
      { method: 'GET', path: '/stats', description: 'Get creator stats' },
      { method: 'GET', path: '/earnings', description: 'Get earnings' },
      { method: 'GET', path: '/content', description: 'Get creator content' },
      { method: 'POST', path: '/content', description: 'Create creator content' },
      { method: 'POST', path: '/payout-request', description: 'Request payout' },
    ],
  },
  {
    path: '/lifestyle',
    targetUrl: process.env.LIFESTYLE_SERVICE_URL || 'http://lifestyle-service:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/feed', description: 'Get lifestyle feed' },
      { method: 'GET', path: '/categories', description: 'Get categories' },
      { method: 'GET', path: '/trending', description: 'Get trending content' },
    ],
  },
  {
    path: '/vertical',
    targetUrl: process.env.VERTICAL_SERVICE_URL || 'http://vertical-service:3017',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/feed', description: 'Get vertical feed' },
      { method: 'GET', path: '/categories', description: 'Get categories' },
    ],
  },
  {
    path: '/reality',
    targetUrl: process.env.REALITY_SERVICE_URL || 'http://reality-service:3010',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/shows', description: 'List reality shows' },
      { method: 'GET', path: '/shows/:id', description: 'Get show details' },
      { method: 'GET', path: '/shows/:id/contestants', description: 'Get contestants' },
      { method: 'POST', path: '/shows/:id/vote', description: 'Vote for contestant' },
      { method: 'GET', path: '/shows/:id/leaderboard', description: 'Get leaderboard' },
    ],
  },
  {
    path: '/games',
    targetUrl: process.env.GAMES_SERVICE_URL || 'http://games-service:3012',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'List games' },
      { method: 'GET', path: '/:id', description: 'Get game details' },
      { method: 'POST', path: '/:id/play', description: 'Start game session' },
      { method: 'GET', path: '/:id/leaderboard', description: 'Get game leaderboard' },
      { method: 'GET', path: '/tournaments', description: 'List tournaments' },
      { method: 'POST', path: '/tournaments/:id/join', description: 'Join tournament' },
    ],
  },
  {
    path: '/comedy',
    targetUrl: process.env.COMEDY_SERVICE_URL || 'http://comedy-service:3013',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/specials', description: 'List comedy specials' },
      { method: 'GET', path: '/specials/:id', description: 'Get special details' },
      { method: 'GET', path: '/feed', description: 'Get comedy feed' },
      { method: 'POST', path: '/specials/:id/rate', description: 'Rate a special' },
    ],
  },
  {
    path: '/sports',
    targetUrl: process.env.SPORTS_SERVICE_URL || 'http://sports-service:3014',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/fixtures', description: 'List fixtures' },
      { method: 'GET', path: '/fixtures/:id', description: 'Get fixture details' },
      { method: 'GET', path: '/predictions', description: 'Get prediction markets' },
      { method: 'POST', path: '/predictions', description: 'Place prediction' },
      { method: 'GET', path: '/fan-contests', description: 'Get fan contests' },
      { method: 'POST', path: '/fan-contests/:id/enter', description: 'Enter contest' },
    ],
  },
  {
    path: '/movies',
    targetUrl: process.env.MOVIE_SERVICE_URL || 'http://movie-service:3011',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'List movies' },
      { method: 'GET', path: '/:id', description: 'Get movie details' },
      { method: 'GET', path: '/cinema-passes', description: 'Get cinema passes' },
      { method: 'POST', path: '/rent', description: 'Rent a movie' },
      { method: 'GET', path: '/filmmakers', description: 'List filmmakers' },
      { method: 'POST', path: '/filmmakers/project', description: 'Create project' },
    ],
  },
  {
    path: '/media',
    targetUrl: process.env.MEDIA_SERVICE_URL || 'http://media-service:3019',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/upload', description: 'Upload media file' },
      { method: 'GET', path: '/:id', description: 'Get media details' },
      { method: 'DELETE', path: '/:id', description: 'Delete media' },
      { method: 'POST', path: '/:id/process', description: 'Trigger processing' },
    ],
  },
  {
    path: '/support',
    targetUrl: process.env.SUPPORT_SERVICE_URL || 'http://support-service:3020',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/tickets', description: 'Create support ticket' },
      { method: 'GET', path: '/tickets', description: 'List all tickets (admin)' },
      { method: 'GET', path: '/tickets/my', description: 'Get my tickets' },
      { method: 'GET', path: '/tickets/:id', description: 'Get ticket by ID' },
      { method: 'PATCH', path: '/tickets/:id/status', description: 'Update ticket status' },
      { method: 'POST', path: '/tickets/:id/messages', description: 'Add message to ticket' },
      { method: 'POST', path: '/tickets/:id/assign', description: 'Assign ticket' },
      { method: 'POST', path: '/tickets/:id/escalate', description: 'Escalate ticket' },
      { method: 'POST', path: '/tickets/:id/close', description: 'Close ticket' },
      { method: 'GET', path: '/refunds/pending', description: 'Get pending refunds (admin)' },
      { method: 'GET', path: '/refunds/my', description: 'Get my refunds' },
      { method: 'GET', path: '/refunds/:id', description: 'Get refund by ID' },
      { method: 'PATCH', path: '/refunds/:id/process', description: 'Process refund (admin)' },
      { method: 'PATCH', path: '/refunds/:id/reject', description: 'Reject refund (admin)' },
      { method: 'GET', path: '/chargebacks/pending', description: 'Get pending chargebacks (admin)' },
      { method: 'GET', path: '/chargebacks/my', description: 'Get my chargebacks' },
      { method: 'POST', path: '/chargebacks/:id/evidence', description: 'Submit evidence' },
      { method: 'PATCH', path: '/chargebacks/:id/resolve', description: 'Resolve chargeback (admin)' },
      { method: 'GET', path: '/appeals/pending', description: 'Get pending appeals (admin)' },
      { method: 'GET', path: '/appeals/my', description: 'Get my appeals' },
      { method: 'PATCH', path: '/appeals/:id/decide', description: 'Decide appeal (admin)' },
      { method: 'GET', path: '/takedowns/pending', description: 'Get pending takedowns (admin)' },
      { method: 'PATCH', path: '/takedowns/:id/decide', description: 'Decide takedown (admin)' },
      { method: 'GET', path: '/disputes/pending', description: 'Get pending disputes (admin)' },
      { method: 'GET', path: '/disputes/my', description: 'Get my disputes (creator)' },
      { method: 'PATCH', path: '/disputes/:id/resolve', description: 'Resolve dispute (admin)' },
      { method: 'GET', path: '/suspensions/active', description: 'Get active suspensions (admin)' },
      { method: 'GET', path: '/suspensions/my', description: 'Get my suspensions' },
      { method: 'POST', path: '/suspensions/:id/reinstate', description: 'Reinstate user (admin)' },
      { method: 'POST', path: '/suspensions/:id/lift', description: 'Lift suspension early (admin)' },
      { method: 'GET', path: '/dashboard/stats', description: 'Get support stats (admin)' },
      { method: 'GET', path: '/dashboard/recent', description: 'Get recent activity (admin)' },
    ],
  },
  {
    path: '/admin',
    targetUrl: process.env.ADMIN_SERVICE_URL || process.env.USER_SERVICE_URL || 'http://user-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/users', description: 'List all users' },
      { method: 'PATCH', path: '/users/:id', description: 'Update user' },
      { method: 'POST', path: '/users/:id/suspend', description: 'Suspend user' },
      { method: 'GET', path: '/content', description: 'List content (all)' },
      { method: 'PATCH', path: '/content/:id/moderate', description: 'Moderate content' },
      { method: 'GET', path: '/moderation/reports', description: 'Get reports' },
      { method: 'PATCH', path: '/moderation/reports/:id', description: 'Resolve report' },
      { method: 'GET', path: '/analytics', description: 'Get admin analytics' },
      { method: 'GET', path: '/audit-logs', description: 'Get audit logs' },
      { method: 'GET', path: '/creators/verification', description: 'Get verification requests' },
      { method: 'PATCH', path: '/creators/:id/verify', description: 'Verify creator' },
    ],
  },
];

@Controller('api')
@UseGuards(ThrottlerGuard)
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);
  private readonly REQUEST_ID_HEADER = 'X-Request-ID';
  private readonly UPSTREAM_TIMEOUT = 30000;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

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

    const response = await this.forwardRequest(req, res, route.targetUrl, version, requestId);
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
    await this.forwardRequest(req, res, route.targetUrl, version, requestId);
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
    await this.forwardRequest(req, res, route.targetUrl, version, requestId);
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
    await this.forwardRequest(req, res, route.targetUrl, version, requestId);
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
    await this.forwardRequest(req, res, route.targetUrl, version, requestId);
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
      requestId
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
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId);
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
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId);
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
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId);
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
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion, requestId);
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
      data: SERVICE_ROUTES.map((r) => ({
        path: r.path,
        targetUrl: r.targetUrl,
        supportedVersions: r.supportedVersions,
        defaultVersion: r.defaultVersion,
      })),
    };
  }

  private findRoute(service: string): ServiceRoute | undefined {
    return SERVICE_ROUTES.find(
      (r) => r.path === `/${service}` || r.path.startsWith(`/${service}/`)
    );
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
    const userSpecificPatterns = ['/wallet/', '/notifications', '/rewards', '/creator/', '/users/'];
    return userSpecificPatterns.some((pattern) => path.includes(pattern));
  }

  private async forwardRequest(
    req: Request,
    res: Response,
    targetUrl: string,
    version: string = DEFAULT_API_VERSION,
    requestId: string
  ): Promise<unknown> {
    const service = req.params['service'];
    const path = req.params[0] ? `/${req.params[0]}` : '';
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const targetPath = `/v${version}/${service}${path}${queryString ? `?${queryString}` : ''}`;
    const target = `${targetUrl}${targetPath}`;

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
