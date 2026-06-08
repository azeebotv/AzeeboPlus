import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('CreatorPortal');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    })
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  if (!process.env.CREATOR_ALLOWED_ORIGINS) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CREATOR_ALLOWED_ORIGINS environment variable must be set in production');
    }
    Logger.warn('CREATOR_ALLOWED_ORIGINS not set, using default localhost origin');
  }
  const allowedOrigins = process.env.CREATOR_ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3014',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
  });

  app.enableShutdownHooks();

  const port = process.env.PORT || 3014;
  await app.listen(port);
  logger.log(`Creator Portal is running on port ${port}`);
}

bootstrap();
