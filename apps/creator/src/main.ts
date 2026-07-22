import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { configureCors } from '@azeebo/security';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: "v", defaultVersion: "1" });
  const logger = new Logger('Creator');

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(cookieParser());

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
    'http://localhost:4014',
    'http://localhost:4104',
  ];

  configureCors(app, {
    allowedOrigins,
  });

  // Swagger/OpenAPI setup
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Azeebo+ Creator Dashboard')
      .setDescription('API for creator content management, analytics, and monetization')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Creator', 'Creator content management')
      .addTag('Auth', 'Creator authentication')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  app.enableShutdownHooks();

  const port = process.env.PORT || 4014;
  await app.listen(port);
  logger.log(`Creator Dashboard is running on port ${port}`);
}

bootstrap();
