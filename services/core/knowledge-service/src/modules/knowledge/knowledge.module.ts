import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service.js';
import { KnowledgeController } from './knowledge.controller.js';
import { PartialConsumptionService } from './partial-consumption.service.js';
import { SkipProtectionService } from './skip-protection.service.js';
import { RewatchIdempotencyService } from './rewatch-idempotency.service.js';
import { NamespaceIsolationService } from './namespace-isolation.service.js';
import { ManualRemediationService } from './manual-remediation.service.js';
import { KnowledgeAnalyticsService } from './knowledge-analytics.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    PartialConsumptionService,
    SkipProtectionService,
    RewatchIdempotencyService,
    NamespaceIsolationService,
    ManualRemediationService,
    KnowledgeAnalyticsService,
  ],
  exports: [
    KnowledgeService,
    PartialConsumptionService,
    SkipProtectionService,
    RewatchIdempotencyService,
    NamespaceIsolationService,
    ManualRemediationService,
    KnowledgeAnalyticsService,
  ],
})
export class KnowledgeModule {}
