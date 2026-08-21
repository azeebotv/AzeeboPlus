import { Injectable } from '@nestjs/common';

// ============================================================================
// Database Roles & Enforcement (TAA §79)
// ============================================================================

export interface DatabaseRole {
  /** Role name */
  name: string;
  /** Schema this role owns */
  ownedSchema: string;
  /** Allowed operations */
  permissions: {
    select: boolean;
    insert: boolean;
    update: boolean;
    delete: boolean;
    truncate: boolean;
  };
  /** Whether this role can access other schemas */
  crossSchemaAccess: boolean;
  /** Additional schemas this role can read from */
  readableSchemas?: string[];
  /** Additional schemas this role can write to */
  writableSchemas?: string[];
}

export interface RoleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class DatabaseRolesService {
  // ============================================================================
  // Domain Role Definitions (TAA §79)
  // ============================================================================

  private readonly domainRoles: Record<string, DatabaseRole> = {
    // Identity domain
    identityRole: {
      name: 'azeebo_identity',
      ownedSchema: 'identity',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true, // For account deletion
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Catalog domain
    catalogRole: {
      name: 'azeebo_catalog',
      ownedSchema: 'catalog',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Rights domain
    rightsRole: {
      name: 'azeebo_rights',
      ownedSchema: 'rights',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Knowledge domain
    knowledgeRole: {
      name: 'azeebo_knowledge',
      ownedSchema: 'knowledge',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Participation domain
    participationRole: {
      name: 'azeebo_participation',
      ownedSchema: 'participation',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Rewards domain
    rewardsRole: {
      name: 'azeebo_rewards',
      ownedSchema: 'rewards',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Commerce domain
    commerceRole: {
      name: 'azeebo_commerce',
      ownedSchema: 'commerce',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Entitlement domain
    entitlementRole: {
      name: 'azeebo_entitlement',
      ownedSchema: 'entitlement',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Audit domain
    auditRole: {
      name: 'azeebo_audit',
      ownedSchema: 'audit',
      permissions: {
        select: true,
        insert: true,
        update: false, // Audit logs should be immutable
        delete: false,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Media domain
    mediaRole: {
      name: 'azeebo_media',
      ownedSchema: 'media',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Wallet domain
    walletRole: {
      name: 'azeebo_wallet',
      ownedSchema: 'wallet',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Creator domain
    creatorRole: {
      name: 'azeebo_creator',
      ownedSchema: 'creator',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Reality domain
    realityRole: {
      name: 'azeebo_reality',
      ownedSchema: 'reality',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Messaging domain
    messagingRole: {
      name: 'azeebo_messaging',
      ownedSchema: 'messaging',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Notification domain
    notificationRole: {
      name: 'azeebo_notification',
      ownedSchema: 'notification',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Subscription domain
    subscriptionRole: {
      name: 'azeebo_subscription',
      ownedSchema: 'subscription',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Moderation domain
    moderationRole: {
      name: 'azeebo_moderation',
      ownedSchema: 'moderation',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Support domain
    supportRole: {
      name: 'azeebo_support',
      ownedSchema: 'support',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: false,
      },
      crossSchemaAccess: false,
    },

    // Migration role (privileged)
    migrationRole: {
      name: 'azeebo_migration',
      ownedSchema: 'public',
      permissions: {
        select: true,
        insert: true,
        update: true,
        delete: true,
        truncate: true,
      },
      crossSchemaAccess: true,
      readableSchemas: [
        'identity',
        'catalog',
        'rights',
        'knowledge',
        'participation',
        'rewards',
        'commerce',
        'entitlement',
        'audit',
        'media',
        'wallet',
        'creator',
        'reality',
        'messaging',
        'notification',
        'subscription',
        'moderation',
        'support',
      ],
      writableSchemas: [
        'identity',
        'catalog',
        'rights',
        'knowledge',
        'participation',
        'rewards',
        'commerce',
        'entitlement',
        'audit',
        'media',
        'wallet',
        'creator',
        'reality',
        'messaging',
        'notification',
        'subscription',
        'moderation',
        'support',
      ],
    },
  };

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Get role definition for a domain
   */
  getRole(domain: string): DatabaseRole | undefined {
    return this.domainRoles[domain];
  }

  /**
   * Get all role definitions
   */
  getAllRoles(): Record<string, DatabaseRole> {
    return { ...this.domainRoles };
  }

  /**
   * Validate a SQL operation against role permissions
   */
  validateOperation(
    role: string,
    operation: 'select' | 'insert' | 'update' | 'delete' | 'truncate',
    targetSchema: string
  ): RoleValidationResult {
    const roleDef = this.domainRoles[role];
    if (!roleDef) {
      return {
        valid: false,
        errors: [`Unknown role: ${role}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if operation is allowed
    if (!roleDef.permissions[operation]) {
      errors.push(`Role ${role} does not have ${operation} permission`);
    }

    // Check schema access
    if (targetSchema === roleDef.ownedSchema) {
      // Accessing own schema - check permissions
      return { valid: errors.length === 0, errors, warnings };
    }

    if (!roleDef.crossSchemaAccess) {
      errors.push(
        `Role ${role} cannot access schema ${targetSchema} (cross-schema access disabled)`
      );
      return { valid: false, errors, warnings };
    }

    // Check readable schemas for SELECT
    if (operation === 'select' && roleDef.readableSchemas) {
      if (!roleDef.readableSchemas.includes(targetSchema)) {
        errors.push(`Role ${role} cannot SELECT from schema ${targetSchema}`);
      }
    }

    // Check writable schemas for INSERT/UPDATE/DELETE
    if (['insert', 'update', 'delete'].includes(operation) && roleDef.writableSchemas) {
      if (!roleDef.writableSchemas.includes(targetSchema)) {
        errors.push(`Role ${role} cannot ${operation.toUpperCase()} to schema ${targetSchema}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate SQL for creating database roles
   */
  generateRoleCreationSQL(): string[] {
    const sql: string[] = [];

    for (const [, role] of Object.entries(this.domainRoles)) {
      // Create role
      sql.push(`CREATE ROLE ${role.name} WITH LOGIN PASSWORD '${role.name}_secure_password';`);

      // Grant schema usage
      sql.push(`GRANT USAGE ON SCHEMA ${role.ownedSchema} TO ${role.name};`);

      // Grant permissions
      if (role.permissions.select) {
        sql.push(`GRANT SELECT ON ALL TABLES IN SCHEMA ${role.ownedSchema} TO ${role.name};`);
      }
      if (role.permissions.insert) {
        sql.push(`GRANT INSERT ON ALL TABLES IN SCHEMA ${role.ownedSchema} TO ${role.name};`);
      }
      if (role.permissions.update) {
        sql.push(`GRANT UPDATE ON ALL TABLES IN SCHEMA ${role.ownedSchema} TO ${role.name};`);
      }
      if (role.permissions.delete) {
        sql.push(`GRANT DELETE ON ALL TABLES IN SCHEMA ${role.ownedSchema} TO ${role.name};`);
      }
      if (role.permissions.truncate) {
        sql.push(`GRANT TRUNCATE ON ALL TABLES IN SCHEMA ${role.ownedSchema} TO ${role.name};`);
      }

      // Set default privileges for future tables
      sql.push(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA ${role.ownedSchema} GRANT SELECT ON TABLES TO ${role.name};`
      );

      // Cross-schema access for migration role
      if (role.crossSchemaAccess && role.readableSchemas) {
        for (const schema of role.readableSchemas) {
          sql.push(`GRANT USAGE ON SCHEMA ${schema} TO ${role.name};`);
          sql.push(`GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO ${role.name};`);
        }
      }

      sql.push('--');
    }

    return sql;
  }

  /**
   * Generate SQL for denying cross-domain writes
   */
  generateCrossDomainDenySQL(): string[] {
    const sql: string[] = [];

    // Deny cross-domain writes for each role
    for (const [, role] of Object.entries(this.domainRoles)) {
      if (role.crossSchemaAccess) continue; // Skip migration role

      for (const [, otherRole] of Object.entries(this.domainRoles)) {
        if (role.ownedSchema === otherRole.ownedSchema) continue;

        // Deny all operations on other schemas
        sql.push(`REVOKE ALL ON ALL TABLES IN SCHEMA ${otherRole.ownedSchema} FROM ${role.name};`);
      }
    }

    return sql;
  }
}
