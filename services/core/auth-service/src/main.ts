import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from '@azeebo/logger';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { SanitizeOutputInterceptor } from '@azeebo/validation';
import helmet from 'helmet';
import { validateEnvironment } from '@azeebo/shared-types';
import { configureCors } from '@azeebo/security';
// @ts-ignore - body-parser is a transitive dependency of Express
import * as bodyParser from 'body-parser';

async function bootstrap(): Promise<void> {
  // Validate JWT secrets before starting
  const requiredJwtSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missingSecrets = requiredJwtSecrets.filter((secret) => !process.env[secret]);

  if (missingSecrets.length > 0) {
    Logger.error(`Missing required JWT environment variables: ${missingSecrets.join(', ')}`);
    process.exit(1);
  }

  for (const secret of requiredJwtSecrets) {
    if (process.env[secret]!.length < 32) {
      Logger.error(`${secret} must be at least 32 characters long`);
      process.exit(1);
    }
  }

  Logger.log('JWT secrets validated successfully');

  // Validate environment variables before starting the app
  try {
    validateEnvironment(process.env);
    Logger.log('Environment variables validated successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Logger.error('Environment validation failed:', errorMessage);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Payload size limits (10MB max)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Security headers
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

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: 422,
    })
  );

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [];
  if (allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS environment variable must be set');
  }
  configureCors(app, {
    allowedOrigins,
    credentials: true,
    maxAge: 3600,
  });

  // Swagger documentation - only enable in development
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Auth Service')
      .setDescription('Azeebo+ Authentication Service API')
      .setVersion('1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  // Health check
  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 3000);
  Logger.log('Auth Service is running on port ' + (process.env.PORT || 3000));
}
bootstrap();
