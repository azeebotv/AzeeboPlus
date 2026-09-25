# Skill: Add Service

> Scaffold a new microservice following Azeebo+ architectural patterns.

---

## Usage

```
/add-service [category] [service-name]

Example:
/add-service core notification-service
/add-service universes anime-service
/add-service engagement leaderboard-service
```

## What It Does

1. Creates the service directory structure
2. Generates NestJS boilerplate (module, controller, service)
3. Creates Prisma schema with `azeebo_` database prefix
4. Adds Dockerfile and docker-compose.yml
5. Registers routes in API Gateway
6. Adds health check endpoint
7. Creates `.env.example` with required variables

## Directory Structure Created

```
services/[category]/[service-name]/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   └── modules/
│       ├── [module]/
│       │   ├── [module].controller.ts
│       │   ├── [module].service.ts
│       │   ├── [module].module.ts
│       │   └── dto/
│       ├── database/
│       ├── health/
│       └── admin/
├── prisma/
│   └── schema.prisma
├── test/
├── .env
├── .env.example
├── Dockerfile
├── jest.config.js
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## Template: Service Files

### main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();
  app.setGlobalPrefix('[service-name]');

  await app.listen(process.env.PORT || [PORT]);
}
bootstrap();
```

### app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/database/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { [Module]Module } from './modules/[module]/[module].module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    [Module]Module,
  ],
})
export class AppModule {}
```

### [module].service.ts
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class [Module]Service {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.[model].findMany();
  }

  async findOne(id: string) {
    const [model] = await this.prisma.[model].findUnique({ where: { id } });
    if (![model]) throw new NotFoundException('[Model] not found');
    return [model];
  }
}
```

### [module].controller.ts
```typescript
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { [Module]Service } from './[module].service';

@Controller('[module]')
export class [Module]Controller {
  constructor(private readonly [module]Service: [Module]Service) {}

  @Get()
  findAll() {
    return this.[module]Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.[module]Service.findOne(id);
  }
}
```

## Rules

- Service name must match pattern: `[name]-service`
- Database name must match pattern: `azeebo_[name]`
- Port must be unique (check README.md service catalog)
- Include health check at `GET /health`
- Use Prisma for ORM — no raw SQL
- Follow existing service patterns in `/services/core` or `/services/universes`
