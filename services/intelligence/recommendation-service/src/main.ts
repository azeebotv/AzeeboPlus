import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { validateEnvironment } from '@azeebo/shared-types';
import { GlobalExceptionFilter } from '@azeebo/error-handling';
import { LoggingInterceptor } from '@azeebo/logger';

async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    })
  );

  app.setGlobalPrefix('v1/recommendation');

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
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

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

  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 3009);
  Logger.log('Recommendation Service is running on port ' + (process.env.PORT || 3009));
}

bootstrap();
