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

interface ServiceRoute {
  path: string;
  targetUrl: string;
  supportedVersions: string[];
  defaultVersion: string;
}

const SERVICE_ROUTES: ServiceRoute[] = [
  {
    path: '/auth',
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/users',
    targetUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/wallet',
    targetUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:3003',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/payments',
    targetUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/content',
    targetUrl: process.env.CONTENT_SERVICE_URL || 'http://localhost:3005',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/notifications',
    targetUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/rewards',
    targetUrl: process.env.REWARD_SERVICE_URL || 'http://localhost:3007',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/search',
    targetUrl: process.env.SEARCH_SERVICE_URL || 'http://localhost:3008',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/analytics',
    targetUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/moderation',
    targetUrl: process.env.MODERATION_SERVICE_URL || 'http://localhost:3010',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/recommendations',
    targetUrl: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3011',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/creator',
    targetUrl: process.env.CREATOR_SERVICE_URL || 'http://localhost:3012',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/lifestyle',
    targetUrl: process.env.LIFESTYLE_SERVICE_URL || 'http://localhost:3016',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/vertical',
    targetUrl: process.env.VERTICAL_SERVICE_URL || 'http://localhost:3017',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
  {
    path: '/queue',
    targetUrl: process.env.QUEUE_SERVICE_URL || 'http://localhost:3015',
    supportedVersions: ['1'],
    defaultVersion: '1',
  },
];

@Controller('api')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @Get(':version/:service/*')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedGet(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    if (!this.validateVersion(version, route)) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: `API version ${version} not supported for this service`,
        supportedVersions: route.supportedVersions,
        defaultVersion: route.defaultVersion,
      });
      return;
    }

    const cacheKey = `proxy:${req.method}:${req.url}`;
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      res.setHeader(API_VERSION_HEADER, version);
      res.json(cachedResponse);
      return;
    }

    const response = await this.forwardRequest(req, res, route.targetUrl, version);
    if (response) {
      await this.cacheManager.set(cacheKey, response, 300000); // 5 minutes
      res.setHeader(API_VERSION_HEADER, version);
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
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    if (!this.validateVersion(version, route)) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: `API version ${version} not supported for this service`,
        supportedVersions: route.supportedVersions,
        defaultVersion: route.defaultVersion,
      });
      return;
    }

    res.setHeader(API_VERSION_HEADER, version);
    await this.forwardRequest(req, res, route.targetUrl, version);
  }

  @Put(':version/:service/*')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedPut(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    if (!this.validateVersion(version, route)) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: `API version ${version} not supported for this service`,
        supportedVersions: route.supportedVersions,
        defaultVersion: route.defaultVersion,
      });
      return;
    }

    res.setHeader(API_VERSION_HEADER, version);
    await this.forwardRequest(req, res, route.targetUrl, version);
  }

  @Patch(':version/:service/*')
  @HttpCode(HttpStatus.OK)
  async proxyVersionedPatch(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    if (!this.validateVersion(version, route)) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: `API version ${version} not supported for this service`,
        supportedVersions: route.supportedVersions,
        defaultVersion: route.defaultVersion,
      });
      return;
    }

    res.setHeader(API_VERSION_HEADER, version);
    await this.forwardRequest(req, res, route.targetUrl, version);
  }

  @Delete(':version/:service/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async proxyVersionedDelete(
    @Param('version') version: string,
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    if (!this.validateVersion(version, route)) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: `API version ${version} not supported for this service`,
        supportedVersions: route.supportedVersions,
        defaultVersion: route.defaultVersion,
      });
      return;
    }

    res.setHeader(API_VERSION_HEADER, version);
    await this.forwardRequest(req, res, route.targetUrl, version);
  }

  @Get(':service/*')
  @HttpCode(HttpStatus.OK)
  async proxyGet(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(req.headers[API_VERSION_HEADER.toLowerCase()] as string);
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    const cacheKey = `proxy:${req.method}:${req.url}:${validatedVersion}`;
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      res.setHeader(API_VERSION_HEADER, validatedVersion);
      res.json(cachedResponse);
      return;
    }

    const response = await this.forwardRequest(req, res, route.targetUrl, validatedVersion);
    if (response) {
      await this.cacheManager.set(cacheKey, response, 300000); // 5 minutes
      res.setHeader(API_VERSION_HEADER, validatedVersion);
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
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(req.headers[API_VERSION_HEADER.toLowerCase()] as string);
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion);
  }

  @Put(':service/*')
  @HttpCode(HttpStatus.OK)
  async proxyPut(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(req.headers[API_VERSION_HEADER.toLowerCase()] as string);
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion);
  }

  @Patch(':service/*')
  @HttpCode(HttpStatus.OK)
  async proxyPatch(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(req.headers[API_VERSION_HEADER.toLowerCase()] as string);
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion);
  }

  @Delete(':service/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async proxyDelete(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const route = this.findRoute(service);
    if (!route) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Service not found' });
      return;
    }

    const version = ApiVersioningConfig.parseVersion(req.headers[API_VERSION_HEADER.toLowerCase()] as string);
    const validatedVersion = this.validateVersion(version, route) ? version : route.defaultVersion;

    res.setHeader(API_VERSION_HEADER, validatedVersion);
    await this.forwardRequest(req, res, route.targetUrl, validatedVersion);
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
      (r) => r.path === `/api/${service}` || r.path.startsWith(`/api/${service}/`)
    );
  }

  private validateVersion(version: string, route: ServiceRoute): boolean {
    return route.supportedVersions.includes(version);
  }

  private async forwardRequest(
    req: Request,
    res: Response,
    targetUrl: string,
    version: string = DEFAULT_API_VERSION
  ): Promise<any> {
    const path = req.params[0] ? `/${req.params[0]}` : '';
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const targetPath = `${path}${queryString ? `?${queryString}` : ''}`;
    const target = `${targetUrl}${targetPath}`;

    try {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set(API_VERSION_HEADER, version);

      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string' && key.toLowerCase() !== API_VERSION_HEADER.toLowerCase()) {
          headers.set(key, value);
        }
      }

      const response = await fetch(target, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      
      if (req.method === 'GET') {
        return data;
      }

      res.status(response.status).json(data);
    } catch (error) {
      this.logger.error(`Failed to forward request to ${target}: ${(error as Error).message}`);
      res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Failed to reach upstream service',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
