import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtConfigModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
