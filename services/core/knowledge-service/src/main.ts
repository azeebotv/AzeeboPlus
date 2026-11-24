import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger (AUD-08): documentation is opt-in, mirroring the API gateway's
  // posture — local dev only AND an explicit SWAGGER_ENABLED=true switch.
  // Never mounted in production, so the unauthenticated /api docs surface
  // cannot expose this service's route map on a reachable host.
  const isLocalDev = process.env.NODE_ENV !== 'production';
  if (isLocalDev && process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Knowledge Service')
      .setDescription(
        'Knowledge Graph API — canonical events, knowledge units, grants, and projections'
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    Logger.log('Swagger documentation enabled at /api', 'Bootstrap');
  }

  const port = process.env.PORT || 3020;
  await app.listen(port);
  Logger.log(`Knowledge service listening on port ${port}`, 'Bootstrap');
}

bootstrap();
