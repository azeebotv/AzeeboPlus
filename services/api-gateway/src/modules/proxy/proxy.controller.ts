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

const SERVICE_CONFIGS: ServiceRouteConfig[] = [
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
      { method: 'POST', path: '/social/google', description: 'Google OAuth login' },
      { method: 'POST', path: '/social/apple', description: 'Apple OAuth login' },
      { method: 'POST', path: '/social/unlink', description: 'Unlink social account' },
      { method: 'POST', path: '/otp/send', description: 'Send OTP' },
      { method: 'POST', path: '/otp/verify', description: 'Verify OTP' },
    ],
  },
  {
    path: '/users',
    envKey: 'USER_SERVICE_URL',
    fallbackUrl: 'http://user-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'includes-prefix',
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
    envKey: 'WALLET_SERVICE_URL',
    fallbackUrl: 'http://wallet-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'includes-prefix',
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
    path: '/content',
    envKey: 'CONTENT_SERVICE_URL',
    fallbackUrl: 'http://content-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
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
    path: '/recommendation',
    envKey: 'RECOMMENDATION_SERVICE_URL',
    fallbackUrl: 'http://recommendation-service:3000',
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
    path: '/rewards',
    envKey: 'REWARD_SERVICE_URL',
    fallbackUrl: 'http://reward-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    pathStrategy: 'no-prefix',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get user rewards' },
      { method: 'POST', path: '/earn', description: 'Earn reward points' },
      { method: 'POST', path: '/redeem', description: 'Redeem reward points' },
      { method: 'GET', path: '/history', description: 'Get reward history' },
      { method: 'GET', path: '/levels', description: 'Get available reward levels' },
      { method: 'POST', path: '/claim', description: 'Claim a reward' },
    ],
  },
];

@Controller('api')
@UseGuards(ThrottlerGuard)
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);
  private readonly REQUEST_ID_HEADER = 'X-Request-ID';
  private readonly UPSTREAM_TIMEOUT = 30000;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService
  ) {}

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

    const response = await this.forwardRequest(req, res, route.targetUrl, version, requestId, route);
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
    // Development: Use localhost URLs directly
    const devUrls: Record<string, string> = {
      AUTH_SERVICE_URL: 'http://localhost:3001',
      USER_SERVICE_URL: 'http://localhost:3002',
      WALLET_SERVICE_URL: 'http://localhost:3003',
      CONTENT_SERVICE_URL: 'http://localhost:3004',
      RECOMMENDATION_SERVICE_URL: 'http://localhost:3017',
      REWARD_SERVICE_URL: 'http://localhost:3018',
    };
    
    return {
      success: true,
      data: SERVICE_CONFIGS.map((r) => ({
        path: r.path,
        targetUrl: devUrls[r.envKey] || r.fallbackUrl,
        supportedVersions: r.supportedVersions,
        defaultVersion: r.defaultVersion,
        pathStrategy: r.pathStrategy,
      })),
    };
  }

  private findRoute(service: string): ServiceRoute | undefined {
    // Development: Use localhost URLs directly
    const devUrls: Record<string, string> = {
      AUTH_SERVICE_URL: 'http://localhost:3001',
      USER_SERVICE_URL: 'http://localhost:3002',
      WALLET_SERVICE_URL: 'http://localhost:3003',
      CONTENT_SERVICE_URL: 'http://localhost:3004',
      RECOMMENDATION_SERVICE_URL: 'http://localhost:3017',
      REWARD_SERVICE_URL: 'http://localhost:3018',
    };
    
    const config = SERVICE_CONFIGS.find(
      (r) => r.path === `/${service}` || r.path.startsWith(`/${service}/`)
    );
    if (!config) return undefined;
    return {
      ...config,
      targetUrl: devUrls[config.envKey] || config.fallbackUrl,
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
    const userSpecificPatterns = ['/wallet/', '/notifications', '/rewards', '/creator/', '/users/', '/recommendations/', '/recommendation/'];
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
