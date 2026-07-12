require('@swc-node/register');
require('reflect-metadata');

const { NestFactory } = require('@nestjs/core');
const { Module, Injectable } = require('@nestjs/common');
const { ConfigModule, ConfigService } = require('@nestjs/config');

@Injectable()
class FailingService {
  constructor(private readonly configService: ConfigService) {
    console.log('FailingService configService:', typeof configService);
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [FailingService],
})
class TestModule {}

async function main() {
  const app = await NestFactory.create(TestModule, { logger: false });
  const failing = app.get(FailingService);
  console.log('configService resolved:', typeof failing.configService);
  process.exit(0);
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
