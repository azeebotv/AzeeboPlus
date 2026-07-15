import { Module } from '@nestjs/common';
import { RedisModule } from '@azeebo/shared-services';
import { FileValidationService } from './services/file-validation.service';

@Module({
  imports: [RedisModule],
  providers: [FileValidationService],
  exports: [FileValidationService],
})
export class CommonModule {}
