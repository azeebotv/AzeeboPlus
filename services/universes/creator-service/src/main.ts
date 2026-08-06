import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';
import { validateEnvironment } from '@azeebo/shared-types';


async function bootstrap(): Promise<void> {
  try {
    validateEnvironment(process.env);
    Logger.log('Environment variables validated successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
    Logger.error('Environment validation failed:', errorMessage);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

    app.use(createHelmetConfig());

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
  configureCors(app, { allowedOrigins, credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Azeebo+ Creator Service')
      .setDescription('Creator management API for Azeebo+ platform')
      .setVersion('1.0')
      .addTag('creators', 'Creator operations')
      .addBearerAuth()
      .addServer(process.env.API_GATEWAY_URL || 'http://localhost:3013', 'API Gateway')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    Logger.log('Swagger documentation enabled at /api/docs');
  }

  // Versioning disabled: controllers already prefix routes with 'v1/' manually

  const port = process.env.PORT || 3018;
  app.enableShutdownHooks();
  await app.listen(port);
  const logger = new Logger('Creator Service');
  logger.log(`Creator Service running on port ${port}`);
}

bootstrap();
