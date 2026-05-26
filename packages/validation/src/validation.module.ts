import { Module, Global } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
          disableErrorMessages: process.env.NODE_ENV === 'production',
        }),
    },
  ],
  exports: [],
})
export class ValidationModule {}
