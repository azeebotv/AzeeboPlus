// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { json } from 'express';
import { extname, join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { ORIGINS } from '@azeebo/shared-types';
import { configureCors } from '@azeebo/security';
import { upstreamAuthMiddleware } from './common/upstream-auth.middleware';

// Ensure required env vars are present early
if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('❌ JWT_ACCESS_SECRET environment variable is not set');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('❌ JWT_REFRESH_SECRET environment variable is not set');
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
  const logger = new Logger('AdminApp');

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(cookieParser());

  // Capture caller identity (Bearer header, access_token cookie, gateway
  // stamp) into request-scoped AsyncLocalStorage BEFORE the router, so every
  // server-side proxy (Agbala, live-events, analytics) can forward verified
  // identity upstream — cookie-only SPA requests previously reached
  // downstream services with zero identity (401 → 502). Express-level
  // registration is deliberate: Nest forRoutes() does not match
  // URI-versioned routes registered without an explicit version.
  app.use(upstreamAuthMiddleware);

  // The SPA calls "/api/v1/..." (the gateway's public shape). Behind the vite
  // dev server those requests go to the gateway; when THIS process serves the
  // built SPA directly (:4016), strip the "/api" prefix so they reach this
  // app's versioned routes (/v1/...) — and the auth proxy below.
  // Parse JSON bodies BEFORE the rewrite/proxy middleware below — Nest's own
  // body parser mounts with the router, after this point in the chain.
  app.use(json({ limit: '10mb' }));
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
  const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3013';
  const PROXY_SKIP_HEADERS = new Set([
    'transfer-encoding',
    'connection',
    'keep-alive',
    'content-encoding',
  ]);
  const GATEWAY_PROXIED_PREFIXES = /^\/v1\/(borrow|lifestyle|subscription\/bundles|media|creators(\/|$)(?!entries))/;
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url === '/api' || req.url.startsWith('/api/')) {
      req.url = req.url.slice('/api'.length) || '/';
    }
    // auth-service owns the token lifecycle (login/refresh/me/cookie/csrf).
    // Proxy those paths so the directly-served SPA can authenticate without
    // the gateway; cookies and set-cookie headers flow through untouched.
    if (/^\/v1\/auth(\/|$)/.test(req.url)) {
      const upstreamHeaders: Record<string, string> = {
        'content-type': (req.headers['content-type'] as string) || 'application/json',
        cookie: (req.headers.cookie as string) || '',
      };
      if (req.headers.authorization)
        upstreamHeaders.authorization = req.headers.authorization as string;
      if (req.headers['x-csrf-token'])
        upstreamHeaders['x-csrf-token'] = req.headers['x-csrf-token'] as string;
      void fetch(`${AUTH_SERVICE_URL}${req.url}`, {
        method: req.method,
        headers: upstreamHeaders,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
      })
        .then(async (upstream) => {
          upstream.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') return; // handled below
            if (!PROXY_SKIP_HEADERS.has(key.toLowerCase())) res.setHeader(key, value);
          });
          // Multiple cookies (e.g. refresh rotation) must append, not overwrite.
          const cookies = upstream.headers.getSetCookie?.() ?? [];
          for (const c of cookies) res.append('set-cookie', c);
          res.status(upstream.status);
          res.send(await upstream.text());
        })
        .catch((e: Error) => {
          res.status(502).json({
            success: false,
            message: `auth-service unreachable at ${AUTH_SERVICE_URL} — is it running?`,
            error: e.message,
          });
        });
      return;
    }

    // Microservices mounted on API gateway (borrow, lifestyle, subscription bundles, etc.)
    if (GATEWAY_PROXIED_PREFIXES.test(req.url)) {
      const upstreamHeaders: Record<string, string> = {
        'content-type': (req.headers['content-type'] as string) || 'application/json',
        cookie: (req.headers.cookie as string) || '',
      };
      if (req.headers.authorization)
        upstreamHeaders.authorization = req.headers.authorization as string;
      if (req.headers['x-csrf-token'])
        upstreamHeaders['x-csrf-token'] = req.headers['x-csrf-token'] as string;
      const gatewaySecret = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;
      if (gatewaySecret) upstreamHeaders['x-gateway-secret'] = gatewaySecret;

      void fetch(`${API_GATEWAY_URL}/api${req.url}`, {
        method: req.method,
        headers: upstreamHeaders,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
        signal: AbortSignal.timeout(10000),
      })
        .then(async (upstream) => {
          if (req.method === 'GET' && upstream.status >= 500) {
            res.status(200).json({
              success: true,
              data: [],
              items: [],
              meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
              _upstreamOffline: true,
            });
            return;
          }
          upstream.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') return;
            if (!PROXY_SKIP_HEADERS.has(key.toLowerCase())) res.setHeader(key, value);
          });
          res.status(upstream.status);
          res.send(await upstream.text());
        })
        .catch((e: Error) => {
          // Graceful fallback ONLY for non-critical read queries when offline
          if (req.method === 'GET') {
            res.status(200).json({
              success: true,
              data: [],
              items: [],
              meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
              _upstreamOffline: true,
            });
            return;
          }
          // Mutations must explicitly fail so admins know the operation did not execute
          res.status(502).json({
            success: false,
            message: `Upstream microservice offline at ${API_GATEWAY_URL}: ${e.message}`,
            _upstreamOffline: true,
          });
        });
      return;
    }
    // SPA deep links: serve-static's wildcard fallback registers behind
    // Nest's router, so hard loads of /login, /ops, ... 404 with JSON.
    // Browsers always send Accept: text/html for document loads — serve the
    // SPA for those and let everything else fall through to the API 404.
    if (
      req.method === 'GET' &&
      !req.url.startsWith('/v1/') &&
      !extname(req.url.split('?')[0]) &&
      (req.headers.accept || '').includes('text/html')
    ) {
      res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
      return;
    }
    next();
  });

  // Security middlewares — aligned with @azeebo/security package
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // CORS configuration — aligned with shared security package
  const allowedOrigins = process.env.ADMIN_ALLOWED_ORIGINS?.split(',') || [
    ORIGINS.admin,
    'http://localhost:4016',
    'http://localhost:5173',
  ];

  configureCors(app, {
    allowedOrigins,
  });

  // Swagger/OpenAPI setup
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Azeebo+ Admin API')
      .setDescription('API for admin panel operations')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  app.enableShutdownHooks();
  const port = process.env.PORT || 4016;
  await app.listen(port);
  logger.log(`Admin Panel is running on port ${port}`);
}

bootstrap();
