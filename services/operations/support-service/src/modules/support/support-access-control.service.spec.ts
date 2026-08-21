import { Test, TestingModule } from '@nestjs/testing';
import { SupportAccessControlService } from './support-access-control.service';
import { ForbiddenException } from '@nestjs/common';

describe('SupportAccessControlService', () => {
  let service: SupportAccessControlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportAccessControlService],
    }).compile();

    service = module.get<SupportAccessControlService>(SupportAccessControlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getScope', () => {
    it('should return agent scope', () => {
      const scope = service.getScope('agent');

      expect(scope.role).toBe('agent');
      expect(scope.canViewAllTickets).toBe(false);
      expect(scope.canAssignTickets).toBe(false);
      expect(scope.canViewPII).toBe(false);
    });

    it('should return supervisor scope', () => {
      const scope = service.getScope('supervisor');

      expect(scope.role).toBe('supervisor');
      expect(scope.canViewAllTickets).toBe(false);
      expect(scope.canAssignTickets).toBe(true);
      expect(scope.canViewPII).toBe(true);
      expect(scope.canManageSLA).toBe(true);
    });

    it('should return admin scope', () => {
      const scope = service.getScope('admin');

      expect(scope.role).toBe('admin');
      expect(scope.canViewAllTickets).toBe(true);
      expect(scope.canAssignTickets).toBe(true);
      expect(scope.canViewPII).toBe(true);
      expect(scope.canExportData).toBe(true);
    });

    it('should default to agent for unknown role', () => {
      const scope = service.getScope('unknown' as any);

      expect(scope.role).toBe('agent');
    });
  });

  describe('canAccessTicket', () => {
    it('should allow admin to access any ticket', () => {
      const result = service.canAccessTicket('admin', 'admin-1', {
        assignedTo: 'agent-1',
        teamId: 'team-a',
      });

      expect(result).toBe(true);
    });

    it('should allow agent to access own ticket', () => {
      const result = service.canAccessTicket('agent', 'agent-1', {
        assignedTo: 'agent-1',
      });

      expect(result).toBe(true);
    });

    it('should deny agent access to others ticket', () => {
      const result = service.canAccessTicket('agent', 'agent-1', {
        assignedTo: 'agent-2',
      });

      expect(result).toBe(false);
    });

    it('should allow supervisor to access team ticket', () => {
      const result = service.canAccessTicket('supervisor', 'super-1', {
        assignedTo: 'agent-1',
        teamId: 'team-a',
      });

      expect(result).toBe(true);
    });

    it('should allow supervisor to access unassigned ticket', () => {
      const result = service.canAccessTicket('supervisor', 'super-1', {
        assignedTo: null,
      });

      expect(result).toBe(true);
    });
  });

  describe('enforceAccess', () => {
    it('should not throw when access is allowed', () => {
      expect(() =>
        service.enforceAccess(
          'admin',
          'admin-1',
          {
            assignedTo: 'agent-1',
          },
          'view'
        )
      ).not.toThrow();
    });

    it('should throw ForbiddenException when access denied', () => {
      expect(() =>
        service.enforceAccess(
          'agent',
          'agent-1',
          {
            assignedTo: 'agent-2',
          },
          'view'
        )
      ).toThrow(ForbiddenException);
    });
  });

  describe('maskPII', () => {
    it('should not mask PII for admin', () => {
      const data = {
        email: 'user@example.com',
        phone: '+2341234567890',
      };

      const result = service.maskPII(data, 'admin');

      expect(result.email).toBe('user@example.com');
      expect(result.phone).toBe('+2341234567890');
    });

    it('should mask PII for agent', () => {
      const data = {
        email: 'user@example.com',
        phone: '+2341234567890',
        name: 'John Doe',
      };

      const result = service.maskPII(data, 'agent');

      expect(result.email).not.toBe('user@example.com');
      expect(result.phone).not.toBe('+2341234567890');
      expect(result.name).toBe('John Doe'); // Non-PII field unchanged
    });

    it('should handle missing PII fields gracefully', () => {
      const data = { name: 'John' };

      const result = service.maskPII(data, 'agent');

      expect(result.name).toBe('John');
    });
  });
});
