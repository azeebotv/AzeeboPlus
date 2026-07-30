import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import { LoggingInterceptor } from '@azeebo/logger';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { validateEnvironment } from '@azeebo/shared-types';


async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  app.useGlobalFilters(new GlobalExceptionFilter());

    app.use(createHelmetConfig())
;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  if (!process.env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS environment variable must be set');
  }
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  configureCors(app, { allowedOrigins, credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Analytics Service')
      .setDescription('Azeebo+ Analytics Service API')
      .setVersion('1.0.0')
      .addTag('analytics')
      .addServer('http://localhost:3013', 'API Gateway')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  // Versioning disabled: controllers already prefix routes with 'v1/' manually

  app.enableShutdownHooks();

  const port = process.env.PORT || 3008;
  await app.listen(port);
  const logger = new Logger('Analytics Service');
  logger.log(`Analytics Service running on port ${port}`);
}

bootstrap();
