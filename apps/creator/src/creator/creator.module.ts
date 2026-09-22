import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreatorController } from './creator.controller';
import { PublicBoardsController } from './public-boards.controller';
import { CreatorService } from './creator.service';
import { ArchivedContentSweeperService } from './archived-content-sweeper.service';

@Module({
  imports: [AuthModule],
  controllers: [CreatorController, PublicBoardsController],
  providers: [CreatorService, ArchivedContentSweeperService],
  exports: [CreatorService],
})
export class CreatorModule {}
