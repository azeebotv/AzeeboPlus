import { Module, Global } from '@nestjs/common';
import { DataClassificationService } from './classification/data-classification.service';
import { BreakGlassService } from './break-glass/break-glass.service';
import { DualControlService } from './dual-control/dual-control.service';
import { LogRedactionService } from './log-redaction/log-redaction.service';
import { AccountMergeService } from './account-merge/account-merge.service';
import { RightsKillService } from './rights-kill/rights-kill.service';
import { ImmutableAuditService } from './audit-immutable/immutable-audit.service';
import { MfaGuard } from './mfa/mfa-guard.service';

/**
 * Global security module that provides all security services.
 *
 * Import this module in any service that needs security features:
 *
 * ```typescript
 * @Module({
 *   imports: [SecurityModule],
 * })
 * export class MyModule {}
 * ```
 *
 * Then inject any service:
 * ```typescript
 * constructor(
 *   private readonly auditService: ImmutableAuditService,
 *   private readonly breakGlassService: BreakGlassService,
 * ) {}
 * ```
 */
@Global()
@Module({
  providers: [
    DataClassificationService,
    BreakGlassService,
    DualControlService,
    LogRedactionService,
    AccountMergeService,
    RightsKillService,
    ImmutableAuditService,
    MfaGuard,
  ],
  exports: [
    DataClassificationService,
    BreakGlassService,
    DualControlService,
    LogRedactionService,
    AccountMergeService,
    RightsKillService,
    ImmutableAuditService,
    MfaGuard,
  ],
})
export class SecurityModule {}
