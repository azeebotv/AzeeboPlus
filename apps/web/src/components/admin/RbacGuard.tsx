'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * RBAC with Least-Privilege Per Role (TAA §50)
 *
 * Provides role-based access control for admin UI:
 * - Role hierarchy enforcement
 * - Permission-based UI visibility
 * - Audit trail for admin mutations
 */

export type AdminRole = 'viewer' | 'moderator' | 'support' | 'admin' | 'superadmin';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
}

/** Permission constants */
export const Permissions = {
  // Content management
  CONTENT_VIEW: 'content:view',
  CONTENT_CREATE: 'content:create',
  CONTENT_EDIT: 'content:edit',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish',

  // User management
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_SUSPEND: 'user:suspend',
  USER_DELETE: 'user:delete',

  // Financial
  WALLET_VIEW: 'wallet:view',
  WALLET_ADJUST: 'wallet:adjust',
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_REFUND: 'payment:refund',

  // Admin operations
  ADMIN_VIEW: 'admin:view',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_AUDIT: 'admin:audit',
  ADMIN_DUAL_CONTROL: 'admin:dual_control',

  // Rights management
  RIGHTS_VIEW: 'rights:view',
  RIGHTS_EDIT: 'rights:edit',
  RIGHTS_CLEARANCE: 'rights:clearance',

  // AI Provenance
  AI_PROVENANCE_VIEW: 'ai_provenance:view',
  AI_PROVENANCE_CLEAR: 'ai_provenance:clear',
} as const;

/** Role-based permission mapping */
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  viewer: [
    Permissions.CONTENT_VIEW,
    Permissions.USER_VIEW,
    Permissions.WALLET_VIEW,
    Permissions.PAYMENT_VIEW,
    Permissions.ADMIN_VIEW,
  ],
  moderator: [
    Permissions.CONTENT_VIEW,
    Permissions.CONTENT_EDIT,
    Permissions.USER_VIEW,
    Permissions.USER_SUSPEND,
    Permissions.WALLET_VIEW,
    Permissions.PAYMENT_VIEW,
    Permissions.ADMIN_VIEW,
  ],
  support: [
    Permissions.CONTENT_VIEW,
    Permissions.USER_VIEW,
    Permissions.USER_EDIT,
    Permissions.WALLET_VIEW,
    Permissions.WALLET_ADJUST,
    Permissions.PAYMENT_VIEW,
    Permissions.PAYMENT_REFUND,
    Permissions.ADMIN_VIEW,
    Permissions.RIGHTS_VIEW,
  ],
  admin: [
    Permissions.CONTENT_VIEW,
    Permissions.CONTENT_CREATE,
    Permissions.CONTENT_EDIT,
    Permissions.CONTENT_DELETE,
    Permissions.CONTENT_PUBLISH,
    Permissions.USER_VIEW,
    Permissions.USER_EDIT,
    Permissions.USER_SUSPEND,
    Permissions.WALLET_VIEW,
    Permissions.WALLET_ADJUST,
    Permissions.PAYMENT_VIEW,
    Permissions.PAYMENT_REFUND,
    Permissions.ADMIN_VIEW,
    Permissions.ADMIN_SETTINGS,
    Permissions.ADMIN_AUDIT,
    Permissions.RIGHTS_VIEW,
    Permissions.RIGHTS_EDIT,
    Permissions.RIGHTS_CLEARANCE,
    Permissions.AI_PROVENANCE_VIEW,
    Permissions.AI_PROVENANCE_CLEAR,
  ],
  superadmin: Object.values(Permissions),
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface RbacContextType {
  user: AdminUser | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
  isRole: (role: AdminRole) => boolean;
  isAtLeastRole: (role: AdminRole) => boolean;
}

const RbacContext = createContext<RbacContextType>({
  user: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isRole: () => false,
  isAtLeastRole: () => false,
});

export function useRbac() {
  return useContext(RbacContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const ROLE_HIERARCHY: AdminRole[] = ['viewer', 'moderator', 'support', 'admin', 'superadmin'];

export function RbacProvider({ children, user }: { children: ReactNode; user: AdminUser | null }) {
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Check explicit permissions first
    if (user.permissions.includes(permission)) return true;
    // Fall back to role-based permissions
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  };

  const hasAnyPermission = (...permissions: string[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (...permissions: string[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  const isRole = (role: AdminRole): boolean => {
    return user?.role === role;
  };

  const isAtLeastRole = (role: AdminRole): boolean => {
    if (!user) return false;
    const userLevel = ROLE_HIERARCHY.indexOf(user.role);
    const requiredLevel = ROLE_HIERARCHY.indexOf(role);
    return userLevel >= requiredLevel;
  };

  return (
    <RbacContext.Provider
      value={{ user, hasPermission, hasAnyPermission, hasAllPermissions, isRole, isAtLeastRole }}
    >
      {children}
    </RbacContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Guard Components
// ---------------------------------------------------------------------------

/**
 * Renders children only if user has the required permission
 */
export function PermissionGuard({
  permission,
  children,
  fallback,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useRbac();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders children only if user has at least the specified role
 */
export function RoleGuard({
  role,
  children,
  fallback,
}: {
  role: AdminRole;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAtLeastRole } = useRbac();
  return isAtLeastRole(role) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders children only if user is superadmin
 */
export function SuperadminGuard({ children }: { children: ReactNode }) {
  return <RoleGuard role="superadmin">{children}</RoleGuard>;
}

// NOTE: there is deliberately no client-side audit POST here — the admin
// backend has no POST /admin/audit route (the audit trail is written
// server-side by the services themselves, see AuditLogService).
