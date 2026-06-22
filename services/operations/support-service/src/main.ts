import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';
import { validateEnvironment } from '@azeebo/shared-types';

async function bootstrap() {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    })
  );

  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS')
    ?.split(',')
    .map((o) => o.trim());
  if (!allowedOrigins || allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS environment variable must be set');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  app.enableShutdownHooks();

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Azeebo+ Support Service')
      .setDescription('Support workflows API for refunds, chargebacks, appeals, and more')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3020;
  await app.listen(port);
  Logger.log(`Support service running on port ${port}`);
}

bootstrap();
