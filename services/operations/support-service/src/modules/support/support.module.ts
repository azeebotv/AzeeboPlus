import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { SupportController } from '../support/support.controller';
import { SupportService } from '../support/support.service';
import { SupportRepository } from '../support/support.repository';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    JwtConfigModule,
  ],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository, PrismaService],
})
export class SupportModule {}
