import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { LoggingInterceptor } from '@azeebo/logger';
import { GlobalExceptionFilter } from '@azeebo/error-handling';

async function bootstrap(): Promise<void> {
  if (!process.env.JWT_ACCESS_SECRET) {
    Logger.error('JWT_ACCESS_SECRET environment variable is required');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Cookie parsing for CSRF protection and auth cookies
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  // Body size limits to prevent memory exhaustion attacks (SEC-010)
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

  app.useGlobalFilters(new GlobalExceptionFilter());

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  // Allow-listed origins for all frontend apps
  const allowedOrigins = [
    'https://app.azeeboplus.com',
    'https://creator.azeeboplus.com',
    'https://admin.azeeboplus.com',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:4014',
    'http://localhost:4016',
  ];

  // Accept env-var overrides for additional origins
  const originsEnv = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
  if (originsEnv) {
    originsEnv.split(',').forEach((o: string) => {
      const trimmed = o.trim();
      if (trimmed && !allowedOrigins.includes(trimmed)) {
        allowedOrigins.push(trimmed);
      }
    });
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API Gateway')
      .setDescription('Azeebo+ API Gateway')
      .setVersion('1.0.0')
      .addTag('gateway')
      .addServer('http://localhost:3013', 'API Gateway')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger documentation enabled at /docs');
  }

  const port = process.env.PORT || 3013;
  app.enableShutdownHooks();
  await app.listen(port);
  const logger = new Logger('API Gateway');
  logger.log(`API Gateway running on port ${port}`);
}

bootstrap();
