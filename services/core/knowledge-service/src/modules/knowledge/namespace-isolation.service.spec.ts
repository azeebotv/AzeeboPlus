import { Test, TestingModule } from '@nestjs/testing';
import {
  NamespaceIsolationService,
  Namespace,
  CrossNamespaceMapping,
} from './namespace-isolation.service';

describe('NamespaceIsolationService', () => {
  let service: NamespaceIsolationService;

  const mockNamespaceA: Omit<Namespace, 'id'> = {
    name: 'title-a',
    displayName: 'Title A',
    isCrossNamespaceAllowed: true,
    allowedCrossMappings: [],
  };

  const mockNamespaceB: Omit<Namespace, 'id'> = {
    name: 'title-b',
    displayName: 'Title B',
    isCrossNamespaceAllowed: false,
    allowedCrossMappings: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NamespaceIsolationService],
    }).compile();

    service = module.get<NamespaceIsolationService>(NamespaceIsolationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNamespace', () => {
    it('should create a namespace with generated ID', async () => {
      const result = await service.createNamespace(mockNamespaceA);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('title-a');
      expect(result.displayName).toBe('Title A');
      expect(result.isCrossNamespaceAllowed).toBe(true);
    });

    it('should store the namespace', async () => {
      const created = await service.createNamespace(mockNamespaceA);
      const retrieved = await service.getNamespace(created.id);

      expect(retrieved).toEqual(created);
    });
  });

  describe('getNamespace', () => {
    it('should return undefined for non-existent namespace', async () => {
      const result = await service.getNamespace('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return the namespace by ID', async () => {
      const created = await service.createNamespace(mockNamespaceA);
      const result = await service.getNamespace(created.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe('title-a');
    });
  });

  describe('getNamespaceByName', () => {
    it('should return undefined for non-existent name', async () => {
      const result = await service.getNamespaceByName('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return the namespace by name', async () => {
      await service.createNamespace(mockNamespaceA);
      const result = await service.getNamespaceByName('title-a');

      expect(result).toBeDefined();
      expect(result?.name).toBe('title-a');
    });
  });

  describe('canAccessAcrossNamespaces', () => {
    it('should allow access within same namespace', async () => {
      const ns = await service.createNamespace(mockNamespaceA);
      const result = service.canAccessAcrossNamespaces(ns.id, ns.id);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Same namespace');
    });

    it('should deny access when source namespace not found', () => {
      const result = service.canAccessAcrossNamespaces('non-existent', 'also-non-existent');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Namespace not found');
    });

    it('should deny access when cross-namespace not allowed', async () => {
      const nsB = await service.createNamespace(mockNamespaceB);
      const nsA: Omit<Namespace, 'id'> = {
        ...mockNamespaceA,
        isCrossNamespaceAllowed: false,
      };
      const createdA = await service.createNamespace(nsA);

      const result = service.canAccessAcrossNamespaces(createdA.id, nsB.id);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not allow cross-namespace access');
    });

    it('should allow access when target is in allowed mappings', async () => {
      const nsB = await service.createNamespace(mockNamespaceB);
      const nsA: Omit<Namespace, 'id'> = {
        ...mockNamespaceA,
        isCrossNamespaceAllowed: true,
        allowedCrossMappings: [nsB.id],
      };
      const createdA = await service.createNamespace(nsA);

      const result = service.canAccessAcrossNamespaces(createdA.id, nsB.id);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Target namespace is in allowed mappings');
    });

    it('should deny access when target not in allowed mappings', async () => {
      const nsB = await service.createNamespace(mockNamespaceB);
      const nsA: Omit<Namespace, 'id'> = {
        ...mockNamespaceA,
        isCrossNamespaceAllowed: true,
        allowedCrossMappings: ['other-namespace'],
      };
      const createdA = await service.createNamespace(nsA);

      const result = service.canAccessAcrossNamespaces(createdA.id, nsB.id);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cross-namespace access not configured');
    });
  });

  describe('createCrossNamespaceMapping', () => {
    it('should create a cross-namespace mapping', async () => {
      const nsA = await service.createNamespace(mockNamespaceA);
      const nsB = await service.createNamespace(mockNamespaceB);

      const mapping: Omit<CrossNamespaceMapping, 'id'> = {
        sourceNamespaceId: nsA.id,
        targetNamespaceId: nsB.id,
        knowledgeUnitIds: ['ku-1', 'ku-2'],
        mappingType: 'equivalent',
        isActive: true,
      };

      const result = await service.createCrossNamespaceMapping(mapping);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.sourceNamespaceId).toBe(nsA.id);
      expect(result.targetNamespaceId).toBe(nsB.id);
      expect(result.knowledgeUnitIds).toEqual(['ku-1', 'ku-2']);
      expect(result.mappingType).toBe('equivalent');
    });
  });

  describe('getMappingsForNamespace', () => {
    it('should return empty array when no mappings exist', async () => {
      const ns = await service.createNamespace(mockNamespaceA);
      const result = await service.getMappingsForNamespace(ns.id);
      expect(result).toEqual([]);
    });

    it('should return active mappings for a namespace', async () => {
      const nsA = await service.createNamespace(mockNamespaceA);
      const nsB = await service.createNamespace(mockNamespaceB);

      await service.createCrossNamespaceMapping({
        sourceNamespaceId: nsA.id,
        targetNamespaceId: nsB.id,
        knowledgeUnitIds: ['ku-1'],
        mappingType: 'equivalent',
        isActive: true,
      });

      const resultA = await service.getMappingsForNamespace(nsA.id);
      const resultB = await service.getMappingsForNamespace(nsB.id);

      expect(resultA.length).toBe(1);
      expect(resultB.length).toBe(1);
    });

    it('should not return inactive mappings', async () => {
      const nsA = await service.createNamespace(mockNamespaceA);
      const nsB = await service.createNamespace(mockNamespaceB);

      await service.createCrossNamespaceMapping({
        sourceNamespaceId: nsA.id,
        targetNamespaceId: nsB.id,
        knowledgeUnitIds: ['ku-1'],
        mappingType: 'equivalent',
        isActive: false,
      });

      const result = await service.getMappingsForNamespace(nsA.id);
      expect(result.length).toBe(0);
    });
  });

  describe('getMappedKnowledgeUnits', () => {
    it('should return unmapped units when no mapping exists', async () => {
      const nsA = await service.createNamespace(mockNamespaceA);
      const nsB = await service.createNamespace(mockNamespaceB);

      const result = await service.getMappedKnowledgeUnits(nsA.id, nsB.id, ['ku-1', 'ku-2']);

      expect(result.mapped).toEqual([]);
      expect(result.unmapped).toEqual(['ku-1', 'ku-2']);
    });

    it('should return mapped and unmapped units', async () => {
      const nsA = await service.createNamespace(mockNamespaceA);
      const nsB = await service.createNamespace(mockNamespaceB);

      await service.createCrossNamespaceMapping({
        sourceNamespaceId: nsA.id,
        targetNamespaceId: nsB.id,
        knowledgeUnitIds: ['ku-1', 'ku-2'],
        mappingType: 'equivalent',
        isActive: true,
      });

      const result = await service.getMappedKnowledgeUnits(nsA.id, nsB.id, [
        'ku-1',
        'ku-2',
        'ku-3',
      ]);

      expect(result.mapped.length).toBe(2);
      expect(result.unmapped).toEqual(['ku-3']);
    });
  });

  describe('validateNamespaceBoundary', () => {
    it('should validate same namespace', async () => {
      const ns = await service.createNamespace(mockNamespaceA);
      const result = service.validateNamespaceBoundary(ns.id, ns.id);

      expect(result.valid).toBe(true);
      expect(result.reason).toBe('Same namespace');
    });

    it('should reject cross-namespace without mapping', async () => {
      const nsA = await service.createNamespace(mockNamespaceA);
      const nsB = await service.createNamespace(mockNamespaceB);

      const result = service.validateNamespaceBoundary(nsA.id, nsB.id);
      expect(result.valid).toBe(false);
    });

    it('should accept valid cross-namespace with mapping', async () => {
      const nsB = await service.createNamespace(mockNamespaceB);
      const nsA = await service.createNamespace({
        ...mockNamespaceA,
        isCrossNamespaceAllowed: true,
        allowedCrossMappings: [nsB.id],
      });

      await service.createCrossNamespaceMapping({
        sourceNamespaceId: nsA.id,
        targetNamespaceId: nsB.id,
        knowledgeUnitIds: ['ku-1'],
        mappingType: 'supplemental',
        isActive: true,
      });

      const result = service.validateNamespaceBoundary(nsA.id, nsB.id);
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('Valid cross-namespace access');
    });
  });
});
