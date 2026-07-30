import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';
import { validateEnvironment } from '@azeebo/shared-types';

import { AppModule } from './app.module';

async function bootstrap() {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

    app.use(createHelmetConfig())
;

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

  app.enableShutdownHooks();

  const port = process.env.PORT || 3015;
  await app.listen(port);
  const logger = new Logger('Queue Service');
  logger.log(`Queue Service running on port ${port}`);
}

bootstrap();
