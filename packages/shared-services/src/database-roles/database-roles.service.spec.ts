import { DatabaseRolesService } from './database-roles.service';

describe('DatabaseRolesService', () => {
  let service: DatabaseRolesService;

  beforeEach(() => {
    service = new DatabaseRolesService();
  });

  describe('getRole', () => {
    it('should return identity role', () => {
      const role = service.getRole('identityRole');
      expect(role).toBeDefined();
      expect(role?.name).toBe('azeebo_identity');
      expect(role?.ownedSchema).toBe('identity');
      expect(role?.permissions.select).toBe(true);
      expect(role?.permissions.insert).toBe(true);
      expect(role?.crossSchemaAccess).toBe(false);
    });

    it('should return migration role with cross-schema access', () => {
      const role = service.getRole('migrationRole');
      expect(role).toBeDefined();
      expect(role?.crossSchemaAccess).toBe(true);
      expect(role?.readableSchemas).toContain('identity');
      expect(role?.readableSchemas).toContain('commerce');
      expect(role?.permissions.truncate).toBe(true);
    });

    it('should return undefined for unknown role', () => {
      expect(service.getRole('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllRoles', () => {
    it('should return 20 domain roles', () => {
      const roles = service.getAllRoles();
      expect(Object.keys(roles)).toHaveLength(19);
    });

    it('should include all expected domains', () => {
      const roles = service.getAllRoles();
      const schemas = Object.values(roles).map((r) => r.ownedSchema);
      expect(schemas).toContain('identity');
      expect(schemas).toContain('catalog');
      expect(schemas).toContain('rights');
      expect(schemas).toContain('knowledge');
      expect(schemas).toContain('commerce');
      expect(schemas).toContain('audit');
      expect(schemas).toContain('media');
      expect(schemas).toContain('wallet');
      expect(schemas).toContain('creator');
      expect(schemas).toContain('reality');
    });
  });

  describe('validateOperation', () => {
    it('should allow SELECT on own schema', () => {
      const result = service.validateOperation('identityRole', 'select', 'identity');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow INSERT on own schema', () => {
      const result = service.validateOperation('catalogRole', 'insert', 'catalog');
      expect(result.valid).toBe(true);
    });

    it('should deny cross-schema access for domain roles', () => {
      const result = service.validateOperation('identityRole', 'select', 'commerce');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cross-schema access disabled');
    });

    it('should deny TRUNCATE for non-migration roles', () => {
      const result = service.validateOperation('identityRole', 'truncate', 'identity');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('does not have truncate permission');
    });

    it('should allow migration role cross-schema SELECT', () => {
      const result = service.validateOperation('migrationRole', 'select', 'identity');
      expect(result.valid).toBe(true);
    });

    it('should allow migration role cross-schema INSERT', () => {
      const result = service.validateOperation('migrationRole', 'insert', 'commerce');
      expect(result.valid).toBe(true);
    });

    it('should allow migration role TRUNCATE on own schema', () => {
      const result = service.validateOperation('migrationRole', 'truncate', 'public');
      expect(result.valid).toBe(true);
    });

    it('should deny unknown role', () => {
      const result = service.validateOperation('fakeRole', 'select', 'identity');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown role');
    });

    it('should deny UPDATE on audit schema', () => {
      const result = service.validateOperation('auditRole', 'update', 'audit');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('does not have update permission');
    });

    it('should deny DELETE on audit schema', () => {
      const result = service.validateOperation('auditRole', 'delete', 'audit');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('does not have delete permission');
    });
  });

  describe('generateRoleCreationSQL', () => {
    it('should generate CREATE ROLE statements', () => {
      const sql = service.generateRoleCreationSQL();
      const createStatements = sql.filter((s) => s.startsWith('CREATE ROLE'));
      expect(createStatements.length).toBe(19);
      expect(createStatements[0]).toContain('azeebo_identity');
    });

    it('should generate GRANT USAGE statements', () => {
      const sql = service.generateRoleCreationSQL();
      const grantUsage = sql.filter((s) => s.startsWith('GRANT USAGE'));
      expect(grantUsage.length).toBeGreaterThan(0);
    });

    it('should generate ALTER DEFAULT PRIVILEGES statements', () => {
      const sql = service.generateRoleCreationSQL();
      const alterDefault = sql.filter((s) => s.startsWith('ALTER DEFAULT PRIVILEGES'));
      expect(alterDefault.length).toBe(19);
    });
  });

  describe('generateCrossDomainDenySQL', () => {
    it('should generate REVOKE statements for cross-domain denial', () => {
      const sql = service.generateCrossDomainDenySQL();
      const revokeStatements = sql.filter((s) => s.startsWith('REVOKE'));
      expect(revokeStatements.length).toBeGreaterThan(0);
    });

    it('should skip migration role in deny statements', () => {
      const sql = service.generateCrossDomainDenySQL();
      const migrationRevokes = sql.filter((s) => s.includes('azeebo_migration'));
      expect(migrationRevokes).toHaveLength(0);
    });
  });
});
