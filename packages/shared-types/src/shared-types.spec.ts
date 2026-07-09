import { ROLE_PERMISSIONS, PERMISSIONS_KEY } from './index';

describe('shared-types constants', () => {
  describe('PERMISSIONS_KEY', () => {
    it('should be a string constant', () => {
      expect(PERMISSIONS_KEY).toBe('permissions');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for all roles', () => {
      const expectedRoles = [
        'user',
        'creator',
        'moderator',
        'admin',
        'super_admin',
        'partner',
        'sponsor_manager',
      ];
      for (const role of expectedRoles) {
        expect(ROLE_PERMISSIONS).toHaveProperty(role);
        expect(Array.isArray(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS])).toBe(true);
      }
    });

    it('should have more permissions for admin than user', () => {
      expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(ROLE_PERMISSIONS.user.length);
    });

    it('should have more permissions for super_admin than admin', () => {
      expect(ROLE_PERMISSIONS.super_admin.length).toBeGreaterThanOrEqual(
        ROLE_PERMISSIONS.admin.length
      );
    });

    it('user role should have read-only permissions', () => {
      const userPerms = ROLE_PERMISSIONS.user;
      expect(userPerms).toContain('user:read');
      expect(userPerms).toContain('content:read');
      expect(userPerms).not.toContain('user:write');
      expect(userPerms).not.toContain('admin:access');
    });

    it('admin role should have admin:access', () => {
      expect(ROLE_PERMISSIONS.admin).toContain('admin:access');
    });

    it('super_admin should have all admin permissions', () => {
      for (const perm of ROLE_PERMISSIONS.admin) {
        expect(ROLE_PERMISSIONS.super_admin).toContain(perm);
      }
    });

    it('creator should have content:write', () => {
      expect(ROLE_PERMISSIONS.creator).toContain('content:write');
    });

    it('moderator should have content:moderate', () => {
      expect(ROLE_PERMISSIONS.moderator).toContain('content:moderate');
    });

    it('partner should have analytics permissions', () => {
      expect(ROLE_PERMISSIONS.partner).toContain('analytics:view');
      expect(ROLE_PERMISSIONS.partner).toContain('analytics:export');
    });
  });
});
