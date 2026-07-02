import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET })],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
