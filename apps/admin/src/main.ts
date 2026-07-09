// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// Ensure required env vars are present early
if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('❌ JWT_ACCESS_SECRET environment variable is not set');
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('AdminApp');

  app.use(cookieParser());

  // Security middlewares — aligned with @azeebo/security package
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'"],
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
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
    maxAge: 86400,
  });

  app.enableShutdownHooks();
  const port = process.env.PORT || 4016;
  await app.listen(port);
  logger.log(`Admin Panel is running on port ${port}`);
}

bootstrap();
