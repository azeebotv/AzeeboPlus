import { ABTestingService } from './ab-testing.service';

describe('ABTestingService', () => {
  let service: ABTestingService;

  beforeEach(() => {
    ABTestingService.clearStores();
    service = new ABTestingService();
  });

  describe('createExperiment', () => {
    it('should create a new experiment', async () => {
      const experiment = await service.createExperiment({
        name: 'Test Experiment',
        description: 'Testing recommendations',
        hypothesis: 'Algorithm B improves engagement',
        variants: [
          { id: 'control', name: 'Control', description: 'Current algorithm', weight: 0.5, algorithmConfig: {} },
          { id: 'treatment', name: 'Treatment', description: 'New algorithm', weight: 0.5, algorithmConfig: {} },
        ],
        audience: { percentage: 100 },
        metrics: ['engagement', 'retention'],
      });

      expect(experiment.id).toBeDefined();
      expect(experiment.name).toBe('Test Experiment');
      expect(experiment.status).toBe('draft');
    });
  });

  describe('startExperiment', () => {
    it('should start a draft experiment', async () => {
      const experiment = await service.createExperiment({
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        variants: [{ id: 'v1', name: 'V1', description: 'V1', weight: 1, algorithmConfig: {} }],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      const started = await service.startExperiment(experiment.id);
      expect(started.status).toBe('running');
      expect(started.startedAt).toBeDefined();
    });

    it('should reject starting non-draft experiment', async () => {
      const experiment = await service.createExperiment({
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        variants: [{ id: 'v1', name: 'V1', description: 'V1', weight: 1, algorithmConfig: {} }],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      await service.startExperiment(experiment.id);
      await expect(service.startExperiment(experiment.id)).rejects.toThrow('Cannot start');
    });
  });

  describe('assignVariant', () => {
    it('should assign user to a variant', async () => {
      const experiment = await service.createExperiment({
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        variants: [
          { id: 'control', name: 'Control', description: 'Control', weight: 0.5, algorithmConfig: {} },
          { id: 'treatment', name: 'Treatment', description: 'Treatment', weight: 0.5, algorithmConfig: {} },
        ],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      await service.startExperiment(experiment.id);

      const variant = service.assignVariant('user-1', experiment.id);
      expect(['control', 'treatment']).toContain(variant);
    });

    it('should return consistent assignment for same user', async () => {
      const experiment = await service.createExperiment({
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        variants: [
          { id: 'control', name: 'Control', description: 'Control', weight: 0.5, algorithmConfig: {} },
          { id: 'treatment', name: 'Treatment', description: 'Treatment', weight: 0.5, algorithmConfig: {} },
        ],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      await service.startExperiment(experiment.id);

      const variant1 = service.assignVariant('user-1', experiment.id);
      const variant2 = service.assignVariant('user-1', experiment.id);
      expect(variant1).toBe(variant2);
    });

    it('should return empty string for non-running experiment', async () => {
      const experiment = await service.createExperiment({
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        variants: [{ id: 'v1', name: 'V1', description: 'V1', weight: 1, algorithmConfig: {} }],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      const variant = service.assignVariant('user-1', experiment.id);
      expect(variant).toBe('');
    });
  });

  describe('pauseExperiment', () => {
    it('should pause a running experiment', async () => {
      const experiment = await service.createExperiment({
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        variants: [{ id: 'v1', name: 'V1', description: 'V1', weight: 1, algorithmConfig: {} }],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      await service.startExperiment(experiment.id);
      const paused = await service.pauseExperiment(experiment.id);
      expect(paused.status).toBe('paused');
    });
  });

  describe('completeExperiment', () => {
    it('should complete a running experiment', async () => {
      const experiment = await service.createExperiment({
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        variants: [{ id: 'v1', name: 'V1', description: 'V1', weight: 1, algorithmConfig: {} }],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      await service.startExperiment(experiment.id);
      const completed = await service.completeExperiment(experiment.id);
      expect(completed.status).toBe('completed');
      expect(completed.endedAt).toBeDefined();
    });
  });

  describe('getRunningExperiments', () => {
    it('should return only running experiments', async () => {
      const exp1 = await service.createExperiment({
        name: 'Test 1',
        description: 'Test',
        hypothesis: 'Test',
        variants: [{ id: 'v1', name: 'V1', description: 'V1', weight: 1, algorithmConfig: {} }],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      await service.createExperiment({
        name: 'Test 2',
        description: 'Test',
        hypothesis: 'Test',
        variants: [{ id: 'v1', name: 'V1', description: 'V1', weight: 1, algorithmConfig: {} }],
        audience: { percentage: 100 },
        metrics: ['engagement'],
      });

      await service.startExperiment(exp1.id);

      const running = await service.getRunningExperiments();
      expect(running.length).toBe(1);
      expect(running[0].id).toBe(exp1.id);
    });
  });
});
