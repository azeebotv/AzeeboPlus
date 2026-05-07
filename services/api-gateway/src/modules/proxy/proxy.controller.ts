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
} from '@nestjs/common';
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
      { method: 'POST', path: '/signup', description: 'Create new user account' },
      { method: 'POST', path: '/login', description: 'Authenticate user' },
      { method: 'POST', path: '/refresh', description: 'Refresh access token' },
      { method: 'DELETE', path: '/logout', description: 'Logout user' },
      { method: 'GET', path: '/me', description: 'Get current user profile' },
    ],
  },
  {
    path: '/users',
    targetUrl: process.env.USER_SERVICE_URL || 'http://user-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get user profile' },
      { method: 'PUT', path: '/', description: 'Update user profile' },
      { method: 'DELETE', path: '/', description: 'Delete user account' },
      { method: 'GET', path: '/:userId', description: 'Get user by ID' },
    ],
  },
  {
    path: '/wallet',
    targetUrl: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get wallet balance' },
      { method: 'POST', path: '/fund', description: 'Fund wallet' },
      { method: 'POST', path: '/withdraw', description: 'Withdraw from wallet' },
      { method: 'GET', path: '/transactions', description: 'Get transaction history' },
    ],
  },
  {
    path: '/payments',
    targetUrl: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/intent', description: 'Create payment intent' },
      { method: 'GET', path: '/:id', description: 'Get payment status' },
      { method: 'POST', path: '/verify', description: 'Verify payment' },
      { method: 'POST', path: '/refund', description: 'Refund payment' },
    ],
  },
  {
    path: '/content',
    targetUrl: process.env.CONTENT_SERVICE_URL || 'http://content-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'List content items' },
      { method: 'GET', path: '/:id', description: 'Get content by ID' },
      { method: 'POST', path: '/', description: 'Create content' },
      { method: 'PUT', path: '/:id', description: 'Update content' },
      { method: 'DELETE', path: '/:id', description: 'Delete content' },
    ],
  },
  {
    path: '/notifications',
    targetUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get user notifications' },
      { method: 'PUT', path: '/:id/read', description: 'Mark notification as read' },
      { method: 'DELETE', path: '/:id', description: 'Delete notification' },
      { method: 'POST', path: '/', description: 'Send notification' },
    ],
  },
  {
    path: '/rewards',
    targetUrl: process.env.REWARD_SERVICE_URL || 'http://reward-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get reward account' },
      { method: 'POST', path: '/claim', description: 'Claim reward' },
      { method: 'GET', path: '/badges', description: 'Get user badges' },
    ],
  },
  {
    path: '/search',
    targetUrl: process.env.SEARCH_SERVICE_URL || 'http://search-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Search content' },
      { method: 'GET', path: '/suggest', description: 'Search suggestions' },
    ],
  },
  {
    path: '/analytics',
    targetUrl: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/track', description: 'Track event' },
      { method: 'GET', path: '/stats', description: 'Get analytics stats' },
    ],
  },
  {
    path: '/moderation',
    targetUrl: process.env.MODERATION_SERVICE_URL || 'http://moderation-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'POST', path: '/report', description: 'Report content' },
      { method: 'GET', path: '/status/:id', description: 'Get moderation status' },
    ],
  },
  {
    path: '/recommendations',
    targetUrl: process.env.RECOMMENDATION_SERVICE_URL || 'http://recommendation-service:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get recommendations' },
      { method: 'POST', path: '/refresh', description: 'Refresh recommendations' },
    ],
  },
  {
    path: '/creator',
    targetUrl: process.env.CREATOR_SERVICE_URL || 'http://creator-portal:3000',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [
      { method: 'GET', path: '/dashboard', description: 'Get creator dashboard' },
      { method: 'POST', path: '/content', description: 'Create creator content' },
    ],
  },
  {
    path: '/lifestyle',
    targetUrl: process.env.LIFESTYLE_SERVICE_URL || 'http://lifestyle-service:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [{ method: 'GET', path: '/', description: 'Get lifestyle content' }],
  },
  {
    path: '/vertical',
    targetUrl: process.env.VERTICAL_SERVICE_URL || 'http://vertical-service:3017',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [{ method: 'GET', path: '/', description: 'Get vertical content' }],
  },
  {
    path: '/queue',
    targetUrl: process.env.QUEUE_SERVICE_URL || 'http://queue-service:3015',
    supportedVersions: ['1'],
    defaultVersion: '1',
    endpoints: [{ method: 'POST', path: '/publish', description: 'Publish to queue' }],
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
      { method: 'GET', path: '/refunds/pending', description: 'Get pending refunds (admin)' },
      { method: 'POST', path: '/refunds', description: 'Request refund' },
      { method: 'GET', path: '/chargebacks/pending', description: 'Get pending chargebacks (admin)' },
      { method: 'POST', path: '/chargebacks/:id/evidence', description: 'Submit evidence' },
      { method: 'GET', path: '/appeals/pending', description: 'Get pending appeals (admin)' },
      { method: 'POST', path: '/appeals', description: 'Submit appeal' },
      { method: 'GET', path: '/takedowns/pending', description: 'Get pending takedowns (admin)' },
    ],
  },
];

@Controller('api')
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

    const cacheKey = this.buildCacheKey(req, version, requestId);
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

    const cacheKey = this.buildCacheKey(req, validatedVersion, requestId);
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

  private buildCacheKey(req: Request, version: string, requestId: string): string {
    const authHeader = req.headers.authorization || '';
    const userId = this.extractUserIdFromAuth(authHeader);
    const cacheKeyBase = `proxy:${req.method}:${req.url}:v${version}`;

    if (userId && this.isUserSpecificEndpoint(req.path)) {
      return `${cacheKeyBase}:user:${userId}`;
    }

    return `${cacheKeyBase}:request:${requestId}`;
  }

  private extractUserIdFromAuth(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.sub || payload.userId || null;
    } catch {
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
    const path = req.params[0] ? `/${req.params[0]}` : '';
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const targetPath = `${path}${queryString ? `?${queryString}` : ''}`;
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
