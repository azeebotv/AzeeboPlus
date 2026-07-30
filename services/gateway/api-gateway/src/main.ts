import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import cookieParser from 'cookie-parser';
import { LoggingInterceptor } from '@azeebo/logger';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { validateEnvironment } from '@azeebo/shared-types';


async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

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
    app.use(createHelmetConfig())
;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  // Allow-listed origins for all frontend apps
  const allowedOrigins = [
    'https://app.azeeboplus.com',
    'https://creator.azeeboplus.com',
    'https://admin.azeeboplus.com',
  ];

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:4014',
      'http://localhost:4016'
    );
  }

  // Accept env-var overrides for additional origins
  const originsEnv = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
  if (originsEnv) {
    const VALID_ORIGIN = /^https?:\/\/.+/;
    originsEnv.split(',').forEach((o: string) => {
      const trimmed = o.trim();
      if (trimmed && !allowedOrigins.includes(trimmed)) {
        if (VALID_ORIGIN.test(trimmed)) {
          allowedOrigins.push(trimmed);
        } else {
          Logger.warn(`Skipping invalid ALLOWED_ORIGINS entry: "${trimmed}" (must start with http:// or https://)`);
        }
      }
    });
  }

  configureCors(app, { allowedOrigins, credentials: true });

  if (process.env.NODE_ENV !== 'production' && process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('API Gateway')
      .setDescription('Azeebo+ API Gateway')
      .setVersion('1.0.0')
      .addTag('gateway')
      .addServer('http://localhost:3013', 'API Gateway')
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
