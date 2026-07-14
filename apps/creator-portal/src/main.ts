import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('CreatorPortal');

  app.use(cookieParser());

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
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
  });

  // Swagger/OpenAPI setup
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Azeebo+ Creator Portal')
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
  logger.log(`Creator Portal is running on port ${port}`);
}

bootstrap();
