import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createHelmetConfig, configureCors } from '@azeebo/security';

import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';
import { validateEnvironment } from '@azeebo/shared-types';


async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);
  const app = await NestFactory.create(AppModule);

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

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Media Service')
      .setDescription('Azeebo+ Media Service API')
      .setVersion('1.0.0')
      .addTag('media')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  // URI versioning: controllers use bare names (e.g. @Controller('media'))
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  const port = process.env.PORT || 3019;
  app.enableShutdownHooks();
  await app.listen(port);
  Logger.log(`Media Service running on port ${port}`);
}

bootstrap();
