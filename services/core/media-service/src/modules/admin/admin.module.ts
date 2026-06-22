import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UploadModule } from '../upload/upload.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    UploadModule,
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
