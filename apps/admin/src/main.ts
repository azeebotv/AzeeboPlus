// src/main.ts
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Ensure required env vars are present early
if (!process.env.JWT_SECRET) {
  throw new Error('❌ JWT_SECRET environment variable is not set');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('AdminApp');

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true },
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

  // CORS configuration (fallback to localhost)
  const allowedOrigins = process.env.ADMIN_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3016'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
  });

  app.enableShutdownHooks();
  const port = process.env.PORT || 3016;
  await app.listen(port);
  logger.log(`Admin Panel is running on port ${port}`);
}

bootstrap();
