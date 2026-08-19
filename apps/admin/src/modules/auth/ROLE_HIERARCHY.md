# Role Hierarchy

## Overview

The Azeebo+ platform uses a role-based access control (RBAC) system with the following hierarchy:

```
superadmin > admin > moderator > creator > user
```

## Role Definitions

### `user`
- Default role for all registered accounts
- Can browse content, watch videos, participate in polls/predictions
- Can manage their own profile and wallet

### `creator`
- Elevated role selected during onboarding (user selects "creator" role)
- Can upload and manage their own content
- Can access creator analytics and monetization tools
- Can manage their own channels and subscriber relationships

### `moderator`
- Appointed by admin/superadmin
- Can review and moderate reported content
- Can issue warnings and temporary suspensions
- Cannot access financial data or system settings

### `admin`
- Full access to the admin dashboard
- Can manage content, users, feature flags, and system settings
- Can suspend/reactivate user accounts
- Can manage universes, categories, and platform configuration
- **Cannot** permanently delete user accounts
- **Cannot** perform bulk delete operations

### `superadmin`
- Everything an admin can do, plus:
- **Can** permanently delete user accounts (`DELETE /admin/users/:id`)
- **Can** perform bulk content deletion (`POST /admin/content/bulk/delete`)
- **Can** manage other admin accounts
- **Can** access destructive operations that are restricted from regular admins

## Enforcement

### Backend (NestJS)

The `RolesGuard` at `apps/admin/src/modules/auth/guards/roles.guard.ts` enforces role checks:

```typescript
// superadmin bypass: always allowed regardless of @Roles() decorator
return user && (user.role === 'superadmin' || roles.includes(user.role));
```

### Method-level restrictions

Destructive operations use method-level `@Roles('superadmin')` decorators:

| Endpoint | Method | Restriction |
|----------|--------|-------------|
| `DELETE /admin/users/:id` | deleteUser | `@Roles('superadmin')` |
| `POST /admin/content/bulk/delete` | bulkDelete | `@Roles('superadmin')` |

### Controller-level defaults

All admin controllers use `@Roles('admin', 'superadmin')` at the class level, allowing both roles to access most endpoints. Method-level decorators further restrict specific destructive operations.

## Security Notes

1. **superadmin bypass**: The RolesGuard always allows superadmin regardless of the `@Roles()` decorator. This is by design — superadmin should have unrestricted access.

2. **Audit logging**: All admin actions (including superadmin) are logged with actor ID, action type, target, and IP address via `AuditLogService`.

3. **No self-deletion**: Admins cannot delete their own accounts via the admin API. This is enforced at the service layer.
