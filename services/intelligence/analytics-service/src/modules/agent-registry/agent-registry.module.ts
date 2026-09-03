import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AgentRegistryService } from './agent-registry.service';
import { AgentRegistryController } from './agent-registry.controller';

@Module({
  imports: [DatabaseModule],
  providers: [AgentRegistryService],
  controllers: [AgentRegistryController],
  exports: [AgentRegistryService],
})
export class AgentRegistryModule {}
