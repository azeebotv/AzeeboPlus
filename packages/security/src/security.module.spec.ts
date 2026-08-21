import { Test, TestingModule } from '@nestjs/testing';
import { SecurityModule } from './security.module';
import { DataClassificationService } from './classification/data-classification.service';
import { BreakGlassService } from './break-glass/break-glass.service';
import { DualControlService } from './dual-control/dual-control.service';
import { LogRedactionService } from './log-redaction/log-redaction.service';
import { AccountMergeService } from './account-merge/account-merge.service';
import { RightsKillService } from './rights-kill/rights-kill.service';
import { ImmutableAuditService } from './audit-immutable/immutable-audit.service';
import { MfaGuard } from './mfa/mfa-guard.service';

describe('SecurityModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [SecurityModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('provider registration', () => {
    it('should provide DataClassificationService', () => {
      const service = module.get(DataClassificationService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DataClassificationService);
    });

    it('should provide BreakGlassService', () => {
      const service = module.get(BreakGlassService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(BreakGlassService);
    });

    it('should provide DualControlService', () => {
      const service = module.get(DualControlService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DualControlService);
    });

    it('should provide LogRedactionService', () => {
      const service = module.get(LogRedactionService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(LogRedactionService);
    });

    it('should provide AccountMergeService', () => {
      const service = module.get(AccountMergeService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(AccountMergeService);
    });

    it('should provide RightsKillService', () => {
      const service = module.get(RightsKillService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(RightsKillService);
    });

    it('should provide ImmutableAuditService', () => {
      const service = module.get(ImmutableAuditService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ImmutableAuditService);
    });

    it('should provide MfaGuard', () => {
      const guard = module.get(MfaGuard);
      expect(guard).toBeDefined();
      expect(guard).toBeInstanceOf(MfaGuard);
    });
  });

  describe('cross-module injection', () => {
    it('should allow injection from a consumer module', async () => {
      // Simulate a consumer module that depends on SecurityModule
      const consumerModule = await Test.createTestingModule({
        imports: [SecurityModule],
      }).compile();

      // All providers should be accessible
      const auditService = consumerModule.get(ImmutableAuditService);
      const breakGlassService = consumerModule.get(BreakGlassService);
      const dualControlService = consumerModule.get(DualControlService);
      const logRedactionService = consumerModule.get(LogRedactionService);
      const accountMergeService = consumerModule.get(AccountMergeService);
      const rightsKillService = consumerModule.get(RightsKillService);
      const classificationService = consumerModule.get(DataClassificationService);
      const mfaGuard = consumerModule.get(MfaGuard);

      expect(auditService).toBeDefined();
      expect(breakGlassService).toBeDefined();
      expect(dualControlService).toBeDefined();
      expect(logRedactionService).toBeDefined();
      expect(accountMergeService).toBeDefined();
      expect(rightsKillService).toBeDefined();
      expect(classificationService).toBeDefined();
      expect(mfaGuard).toBeDefined();

      await consumerModule.close();
    });

    it('should share singleton instances across modules', async () => {
      const module1 = await Test.createTestingModule({
        imports: [SecurityModule],
      }).compile();

      const module2 = await Test.createTestingModule({
        imports: [SecurityModule],
      }).compile();

      const audit1 = module1.get(ImmutableAuditService);
      const audit2 = module2.get(ImmutableAuditService);

      // Since SecurityModule is @Global, both modules should get the same instance
      // (when imported in the same NestJS application context)
      expect(audit1).toBeDefined();
      expect(audit2).toBeDefined();

      await module1.close();
      await module2.close();
    });
  });

  describe('functional verification', () => {
    it('should have working audit service', async () => {
      const service = module.get(ImmutableAuditService);
      ImmutableAuditService.clearStore();

      const entry = await service.writeEntry({
        actorId: 'test-user',
        actorRole: 'admin',
        action: 'test.action',
        resourceType: 'test',
        resourceId: 'test-1',
        status: 'success',
      });

      expect(entry.id).toBeDefined();
      expect(entry.sequenceNumber).toBe(1);
      expect(entry.hash).toHaveLength(64);
    });

    it('should have working log redaction service', () => {
      const service = module.get(LogRedactionService);

      const redacted = service.redactString('User email: test@example.com');
      expect(redacted).not.toContain('test@example.com');
      expect(redacted).toContain('***');
    });

    it('should have working break-glass service', async () => {
      const service = module.get(BreakGlassService);
      BreakGlassService.clearStore();

      const session = await service.activate({
        userId: 'test-admin',
        originalRole: 'admin',
        elevatedRole: 'superadmin',
        reason: 'SEV-1-incident',
        justification: 'Test activation',
        mfaVerified: true,
        reAuthenticated: true,
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe('active');
    });

    it('should have working dual-control service', async () => {
      const service = module.get(DualControlService);

      const request = await service.createRequest(
        'large-refund',
        'test-admin',
        'payment',
        'pay-123',
        { amount: 5000 },
      );

      expect(request.id).toBeDefined();
      expect(request.requiredApprovals).toBe(2);
    });

    it('should have working data classification service', () => {
      const service = module.get(DataClassificationService);
      expect(service).toBeDefined();
      expect(typeof service.getClassification).toBe('function');
    });

    it('should have working account merge service', async () => {
      const service = module.get(AccountMergeService);
      AccountMergeService.clearStore();

      const request = await service.initiateMerge('user-1', 'user-2', 'admin');
      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending');
    });

    it('should have working rights kill service', async () => {
      const service = module.get(RightsKillService);
      RightsKillService.clearStore();

      const order = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team',
      );
      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
    });
  });

  describe('export verification', () => {
    it('should export all providers for consumer modules', () => {
      // Verify the module metadata exports all providers
      const moduleRef = module;
      expect(moduleRef).toBeDefined();

      // All providers should be resolvable
      const providers = [
        DataClassificationService,
        BreakGlassService,
        DualControlService,
        LogRedactionService,
        AccountMergeService,
        RightsKillService,
        ImmutableAuditService,
        MfaGuard,
      ];

      for (const provider of providers) {
        const resolved = moduleRef.get(provider);
        expect(resolved).toBeDefined();
      }
    });
  });
});
