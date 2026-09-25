import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';
import { AppModule } from './app.module.js';
import { validateEnvironment } from '@azeebo/shared-types';
import { configureCors, createHelmetConfig } from '@azeebo/security';

async function bootstrap() {
  validateEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.use(createHelmetConfig());

  if (!process.env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS environment variable must be set');
  }
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  configureCors(app, { allowedOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );

  const config = new DocumentBuilder()
    .setTitle('Subscription Service API')
    .setDescription('API documentation for AZEEBO+ Subscription Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // NOTE: Swagger path inconsistency across services — most use '/docs', some use '/api/docs'.
  // Standardize on '/docs' when convenient.
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api', app, document);
  }

  // Versioning disabled: controllers already prefix routes with 'v1/' manually

  const port = process.env.PORT || 3026;
  app.enableShutdownHooks();
  await app.listen(port);
  Logger.log(`Subscription service running on port ${port}`, 'Bootstrap');
}

bootstrap();
