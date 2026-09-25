import { SkipProtectionService } from './skip-protection.service';

describe('SkipProtectionService', () => {
  let service: SkipProtectionService;

  beforeEach(() => {
    SkipProtectionService.clearStores();
    service = new SkipProtectionService();
  });

  describe('detectSkipping', () => {
    it('should detect no skipping for normal viewing', () => {
      const events = [
        { timestamp: new Date(), position: 0, action: 'play' as const },
        { timestamp: new Date(), position: 30, action: 'play' as const },
        { timestamp: new Date(), position: 60, action: 'play' as const },
      ];

      const result = service.detectSkipping('user-1', 'content-1', events);

      expect(result.isSkipping).toBe(false);
      expect(result.skipPattern).toBe('none');
    });

    it('should detect fast forward pattern', () => {
      const events = [
        { timestamp: new Date(), position: 0, action: 'play' as const },
        { timestamp: new Date(), position: 10, action: 'seek' as const, skipDistance: 60 },
        { timestamp: new Date(), position: 20, action: 'seek' as const, skipDistance: 60 },
        { timestamp: new Date(), position: 30, action: 'seek' as const, skipDistance: 60 },
      ];

      const result = service.detectSkipping('user-1', 'content-1', events);

      expect(result.isSkipping).toBe(true);
      expect(result.skipPattern).toBe('fast_forward');
    });

    it('should detect jump ahead pattern', () => {
      const events = [
        { timestamp: new Date(), position: 0, action: 'play' as const },
        { timestamp: new Date(), position: 10, action: 'seek' as const, skipDistance: 120 },
        { timestamp: new Date(), position: 20, action: 'seek' as const, skipDistance: 180 },
      ];

      const result = service.detectSkipping('user-1', 'content-1', events);

      expect(result.isSkipping).toBe(true);
      expect(result.skipPattern).toBe('jump_ahead');
    });

    it('should return no skipping for empty events', () => {
      const result = service.detectSkipping('user-1', 'content-1', []);

      expect(result.isSkipping).toBe(false);
    });
  });

  describe('recordSkip', () => {
    it('should record skip events', () => {
      service.recordSkip('user-1', 'content-1');
      service.recordSkip('user-1', 'content-1');

      expect(service.getSkipCount('user-1', 'content-1')).toBe(2);
    });
  });

  describe('isValidConsumption', () => {
    it('should validate consumption with sufficient watch time', () => {
      expect(service.isValidConsumption(80, 3600, 2880)).toBe(true);
    });

    it('should reject consumption with insufficient watch percentage', () => {
      expect(service.isValidConsumption(50, 3600, 1800)).toBe(false);
    });

    it('should reject consumption with insufficient duration', () => {
      expect(service.isValidConsumption(80, 3600, 20)).toBe(false);
    });
  });

  describe('canUnlockKnowledge', () => {
    it('should allow unlock for valid consumption', () => {
      const result = service.canUnlockKnowledge('user-1', 'content-1', 80);

      expect(result.allowed).toBe(true);
    });

    it('should block unlock for too many skips', () => {
      for (let i = 0; i < 5; i++) {
        service.recordSkip('user-1', 'content-1');
      }

      const result = service.canUnlockKnowledge('user-1', 'content-1', 80);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Too many skips');
    });

    it('should block unlock for insufficient watch time', () => {
      const result = service.canUnlockKnowledge('user-1', 'content-1', 50);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient watch time');
    });
  });

  describe('getConfig', () => {
    it('should return default config', () => {
      const config = service.getConfig();

      expect(config.minWatchPercent).toBe(70);
      expect(config.skipWarningThreshold).toBe(3);
      expect(config.skipBlockThreshold).toBe(5);
    });

    it('should accept custom config', () => {
      const customService = new SkipProtectionService({ minWatchPercent: 50 });
      const config = customService.getConfig();

      expect(config.minWatchPercent).toBe(50);
    });
  });
});
