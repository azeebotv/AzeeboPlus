import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { BorrowController } from './borrow.controller.js';
import { BorrowAdminController } from './borrow-admin.controller.js';
import { BorrowService } from './borrow.service.js';
import { DatabaseModule } from '../database/database.module.js';

/**
 * JwtConfigModule is imported explicitly (AdminModule's pattern) because
 * AdminGuard injects JwtService to verify Bearer tokens on direct calls.
 */
@Module({
  imports: [JwtConfigModule, DatabaseModule],
  controllers: [BorrowController, BorrowAdminController],
  providers: [BorrowService],
  exports: [BorrowService],
})
export class BorrowModule {}
