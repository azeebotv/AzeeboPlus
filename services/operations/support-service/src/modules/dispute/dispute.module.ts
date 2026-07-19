import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';

@Module({
  imports: [
    JwtConfigModule,
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
