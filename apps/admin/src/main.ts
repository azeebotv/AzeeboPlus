// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { configureCors } from '@azeebo/security';

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
    'https://admin.azeeboplus.com',
    'http://localhost:4016',
    'http://localhost:4100',
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
