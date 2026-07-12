import { NestFactory } from '@nestjs/core';
import { Module, Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Injectable()
class WorkingService {
  constructor(
    private readonly prisma: string = 'test',
    private readonly cache: string = 'test'
  ) {
    console.log('WorkingService created');
  }
}

@Injectable()
class FailingService {
  constructor(private readonly configService: ConfigService) {
    console.log('FailingService configService:', typeof configService);
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [WorkingService, FailingService],
})
class TestModule {}

async function main() {
  const app = await NestFactory.create(TestModule, { logger: false });
  console.log('App created');
  const working = app.get(WorkingService);
  console.log('WorkingService resolved:', !!working);
  const failing = app.get(FailingService);
  console.log('FailingService resolved:', !!failing);
  console.log('FailingService.configService:', typeof (failing as any).configService);
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
