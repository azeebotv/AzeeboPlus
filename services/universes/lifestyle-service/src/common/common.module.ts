import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@azeebo/shared-services';

@Global()
@Module({
  imports: [RedisModule],
})
export class CommonModule {}
