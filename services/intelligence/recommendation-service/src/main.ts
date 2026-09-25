import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import { validateEnvironment } from '@azeebo/shared-types';

import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';

async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.use(createHelmetConfig());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    })
  );

  if (!process.env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS environment variable must be set');
  }
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  configureCors(app, { allowedOrigins, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Recommendation Service')
    .setDescription('Azeebo+ Recommendation Service API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 3009);
  Logger.log('Recommendation Service is running on port ' + (process.env.PORT || 3009));
}

bootstrap();
