import { BreakGlassService } from './break-glass.service';

describe('BreakGlassService', () => {
  let service: BreakGlassService;

  beforeEach(() => {
    BreakGlassService.clearStore();
    service = new BreakGlassService();
  });

  describe('activate', () => {
    it('should activate a break-glass session with valid MFA and re-auth', async () => {
      const result = await service.activate({
        userId: 'admin-1',
        originalRole: 'admin',
        elevatedRole: 'superadmin',
        reason: 'SEV-1-incident',
        justification: 'Production database is down',
        mfaVerified: true,
        reAuthenticated: true,
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('active');
      expect(result.elevatedRole).toBe('superadmin');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject if MFA not verified', async () => {
      await expect(
        service.activate({
          userId: 'admin-1',
          originalRole: 'admin',
          elevatedRole: 'superadmin',
          reason: 'SEV-1-incident',
          justification: 'Emergency',
          mfaVerified: false,
          reAuthenticated: true,
        }),
      ).rejects.toThrow('MFA verification');
    });

    it('should reject if re-authentication not performed', async () => {
      await expect(
        service.activate({
          userId: 'admin-1',
          originalRole: 'admin',
          elevatedRole: 'superadmin',
          reason: 'SEV-1-incident',
          justification: 'Emergency',
          mfaVerified: true,
          reAuthenticated: false,
        }),
      ).rejects.toThrow('re-authentication');
    });

    it('should reject non-emergency reason', async () => {
      await expect(
        service.activate({
          userId: 'admin-1',
          originalRole: 'admin',
          elevatedRole: 'superadmin',
          reason: 'scheduled-publication' as never,
          justification: 'Regular work',
          mfaVerified: true,
          reAuthenticated: true,
        }),
      ).rejects.toThrow('SEV-1/emergency incident');
    });

    it('should reject duplicate active session', async () => {
      await service.activate({
        userId: 'admin-1',
        originalRole: 'admin',
        elevatedRole: 'superadmin',
        reason: 'SEV-1-incident',
        justification: 'First',
        mfaVerified: true,
        reAuthenticated: true,
      });

      await expect(
        service.activate({
          userId: 'admin-1',
          originalRole: 'admin',
          elevatedRole: 'superadmin',
          reason: 'production-outage',
          justification: 'Second',
          mfaVerified: true,
          reAuthenticated: true,
        }),
      ).rejects.toThrow('already has an active');
    });
  });

  describe('validate', () => {
    it('should validate an active session', async () => {
      const session = await service.activate({
        userId: 'admin-1',
        originalRole: 'admin',
        elevatedRole: 'superadmin',
        reason: 'SEV-1-incident',
        justification: 'Emergency',
        mfaVerified: true,
        reAuthenticated: true,
      });

      const validated = await service.validate(session.id);
      expect(validated.status).toBe('active');
    });

    it('should reject non-existent session', async () => {
      await expect(service.validate('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('revoke', () => {
    it('should revoke an active session', async () => {
      const session = await service.activate({
        userId: 'admin-1',
        originalRole: 'admin',
        elevatedRole: 'superadmin',
        reason: 'SEV-1-incident',
        justification: 'Emergency',
        mfaVerified: true,
        reAuthenticated: true,
      });

      const revoked = await service.revoke(session.id, 'security-lead');
      expect(revoked.status).toBe('revoked');
      expect(revoked.reviewedBy).toBe('security-lead');
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions', async () => {
      await service.activate({
        userId: 'admin-1',
        originalRole: 'admin',
        elevatedRole: 'superadmin',
        reason: 'SEV-1-incident',
        justification: 'Emergency',
        mfaVerified: true,
        reAuthenticated: true,
      });

      const active = await service.getActiveSessions();
      expect(active.length).toBe(1);
    });
  });
});
