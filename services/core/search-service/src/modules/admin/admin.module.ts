import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET })],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
