import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UploadModule } from '../upload/upload.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    UploadModule,
    CommonModule,
    JwtConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
