import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { FeatureFlagsController } from './feature-flags.controller';
import { CommonModule } from '../../common/common.module';
import { UniverseGateMiddleware } from '../../common/universe-gate.middleware';

@Module({
  imports: [CommonModule],
  controllers: [ProxyController, FeatureFlagsController],
})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Disabled universes 404 at the edge (server-side enforcement of
    // universe.<slug>.enabled) — runs before the proxy forwards anything.
    consumer.apply(UniverseGateMiddleware).forRoutes('api');
  }
}
