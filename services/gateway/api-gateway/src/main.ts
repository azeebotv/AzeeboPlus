import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import cookieParser from 'cookie-parser';
import { LoggingInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { ORIGINS, validateEnvironment } from '@azeebo/shared-types';

async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Trust the configured number of proxy hops so req.ip resolves to the real
  // client address; without this, per-IP auth throttling collapses every user
  // behind the load balancer into a single shared bucket.
  const proxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '1', 10);
  app.set('trust proxy', Number.isFinite(proxyHops) && proxyHops >= 0 ? proxyHops : 1);

  // NOTE: Global versioning prefix is intentionally REMOVED.
  // The ProxyController handles versioning via URL path segments (:version/:service/*path).
  // Adding enableVersioning here would create /v1/api/:version/:service/*path which
  // mismatches the frontend's /api/v1/auth/login pattern.
  // Routes are: /api/v1/:service/*path (versioned) and /api/:service/*path (unversioned)

  // Cookie parsing for CSRF protection and auth cookies
  app.use(cookieParser());

  // Body size limits to prevent memory exhaustion attacks (SEC-010)
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Security headers
  app.use(createHelmetConfig());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseSanitizationInterceptor());

  // Allow-listed origins — prefer env var, fall back to production defaults
  const defaultOrigins = [ORIGINS.app, ORIGINS.creator, ORIGINS.admin];

  const originsEnv = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
  let allowedOrigins: string[];

  if (originsEnv) {
    // When env var is set, use it as the single source of truth
    const VALID_ORIGIN = /^https?:\/\/.+/;
    allowedOrigins = originsEnv
      .split(',')
      .map((o: string) => o.trim())
      .filter((o: string) => {
        if (!o) return false;
        if (!VALID_ORIGIN.test(o)) {
          Logger.warn(
            `Skipping invalid ALLOWED_ORIGINS entry: "${o}" (must start with http:// or https://)`
          );
          return false;
        }
        return true;
      });
  } else {
    allowedOrigins = [...defaultOrigins];
  }

  if (process.env.NODE_ENV !== 'production') {
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:4014',
      'http://localhost:4016',
      // Public web app dev server (apps/web, `next dev -p 4111`)
      'http://localhost:4111',
    ];
    for (const origin of devOrigins) {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    }
  }

  configureCors(app, { allowedOrigins, credentials: true });

  // HTTP/rate-limit instrumentation: registered directly on the Express
  // instance BEFORE Nest's router init, so every request (health checks,
  // proxied traffic) is counted. The HttpMetricsModule exposes GET
  // /metrics/http from the same counters.
  const { HttpMetricsService } = await import('./metrics/http-metrics.service');
  const httpMetrics = app.get(HttpMetricsService);
  app.use(httpMetrics.expressMiddleware());

  const isLocalDev = process.env.NODE_ENV === 'development' || process.env.DEPLOY_ENV === 'local';
  if (isLocalDev && process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('API Gateway')
      .setDescription('Azeebo+ API Gateway')
      .setVersion('1.0.0')
      .addTag('gateway')
      .addServer(`http://localhost:${process.env.PORT || '3013'}`, 'API Gateway')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  const port = process.env.PORT || 3013;
  app.enableShutdownHooks();
  await app.listen(port);
  const logger = new Logger('API Gateway');
  logger.log(`API Gateway running on port ${port}`);
}

bootstrap();
