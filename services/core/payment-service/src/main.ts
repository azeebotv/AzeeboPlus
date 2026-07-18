import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';
import { configureCors } from '@azeebo/security';
import { validateEnvironment } from '@azeebo/shared-types';

async function bootstrap(): Promise<void> {
  try {
    validateEnvironment(process.env);
    Logger.log('Environment variables validated successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Logger.error('Environment validation failed:', errorMessage);
    process.exit(1);
  }

  // rawBody: true captures the raw request buffer as req.rawBody (Buffer) for
  // webhook signature verification, while still parsing JSON into req.body.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableVersioning({ type: VersioningType.URI, prefix: "v", defaultVersion: "1" });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    })
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  if (!process.env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS environment variable must be set');
  }
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  configureCors(app, {
    allowedOrigins,
    credentials: true,
    maxAge: 3600,
  });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Azeebo+ Payment Service')
      .setDescription('Payment processing API for Azeebo+ platform')
      .setVersion('1.0')
      .addTag('payments', 'Payment operations')
      .addTag('webhooks', 'Payment provider webhooks')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  // Versioning disabled: controllers already prefix routes with 'v1/' manually

  const port = process.env.PORT || 3003;
  app.enableShutdownHooks();
  await app.listen(port);
  const logger = new Logger('Payment Service');
  logger.log(`Payment Service running on port ${port}`);
}

bootstrap();
