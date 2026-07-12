import { Module, Global } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard.js';

@Global()
@Module({
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class CommonModule {}
