import { DataClassificationService, CLASSIFICATION_REGISTRY } from './data-classification.service';

describe('DataClassificationService', () => {
  let service: DataClassificationService;

  beforeEach(() => {
    service = new DataClassificationService();
  });

  describe('getClassification', () => {
    it('should return classification for known model', () => {
      const result = service.getClassification('User');
      expect(result).toBeDefined();
      expect(result?.classification).toBe('restricted');
      expect(result?.encryptionRequired).toBe(true);
      expect(result?.auditRequired).toBe(true);
    });

    it('should return classification for ContentItem', () => {
      const result = service.getClassification('ContentItem');
      expect(result?.classification).toBe('confidential');
      expect(result?.cacheable).toBe(true);
    });

    it('should return undefined for unknown model', () => {
      expect(service.getClassification('Nonexistent')).toBeUndefined();
    });
  });

  describe('hasAccess', () => {
    it('should allow identity-service to access User', () => {
      expect(service.hasAccess('User', 'identity-service')).toBe(true);
    });

    it('should deny random service access to User', () => {
      expect(service.hasAccess('User', 'random-service')).toBe(false);
    });

    it('should deny access for unknown model', () => {
      expect(service.hasAccess('Nonexistent', 'any-service')).toBe(false);
    });
  });

  describe('requiresEncryption', () => {
    it('should require encryption for User', () => {
      expect(service.requiresEncryption('User')).toBe(true);
    });

    it('should not require encryption for ContentItem', () => {
      expect(service.requiresEncryption('ContentItem')).toBe(false);
    });
  });

  describe('requiresAudit', () => {
    it('should require audit for User', () => {
      expect(service.requiresAudit('User')).toBe(true);
    });

    it('should not require audit for ContentItem', () => {
      expect(service.requiresAudit('ContentItem')).toBe(false);
    });
  });

  describe('getModelsByClassification', () => {
    it('should return all restricted models', () => {
      const models = service.getModelsByClassification('restricted');
      expect(models).toContain('User');
      expect(models).toContain('Payment');
      expect(models).toContain('AuditLog');
    });

    it('should return all confidential models', () => {
      const models = service.getModelsByClassification('confidential');
      expect(models).toContain('ContentItem');
      expect(models).toContain('PointsLedger');
    });

    it('should return all internal models', () => {
      const models = service.getModelsByClassification('internal');
      expect(models).toContain('SearchQueryLog');
    });
  });

  describe('getRestrictedModels', () => {
    it('should return models with highest security', () => {
      const models = service.getRestrictedModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('User');
      expect(models).toContain('Payment');
    });
  });

  describe('registry completeness', () => {
    it('should have classifications for all major domain models', () => {
      const expectedModels = [
        'User', 'Payment', 'Wallet', 'ContentItem',
        'PointsLedger', 'KnowledgeGrant', 'AuditLog', 'SearchQueryLog',
      ];
      for (const model of expectedModels) {
        expect(CLASSIFICATION_REGISTRY[model]).toBeDefined();
      }
    });
  });
});
