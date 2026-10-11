import { Module, Global } from '@nestjs/common';
import { RolesGuard } from '@azeebo/security';

@Global()
@Module({
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class CommonModule {}
