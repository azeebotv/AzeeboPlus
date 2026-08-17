// OpenTelemetry - disabled in local dev (incompatible with Node.js 26)
// Enable in production by setting OTEL_EXPORTER_OTLP_ENDPOINT

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';
import { validateEnvironment } from '@azeebo/shared-types';

async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  app.use(createHelmetConfig());

  // Global prefix is set in controller @Controller() decorators

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
    const config = new DocumentBuilder()
      .setTitle('Wallet Service')
      .setDescription('Azeebo+ Wallet Service API')
      .setVersion('1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  // Versioning disabled: controllers already prefix routes with 'v1/' manually
  // e.g. @Controller('v1/wallet') — enabling URI versioning would create /v1/v1/wallet

  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 3002);
  Logger.log('Wallet Service is running on port ' + (process.env.PORT || 3002));
}
bootstrap();
