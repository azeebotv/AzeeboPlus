import { ColdStartService } from './cold-start.service';

describe('ColdStartService', () => {
  let service: ColdStartService;

  beforeEach(() => {
    service = new ColdStartService();
  });

  describe('getUserStage', () => {
    it('should identify cold users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 3,
        interactionCount: 5,
        contentViewCount: 3,
        completionCount: 1,
      };

      expect(service.getUserStage(profile)).toBe('cold');
    });

    it('should identify warm users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 15,
        interactionCount: 30,
        contentViewCount: 20,
        completionCount: 10,
      };

      expect(service.getUserStage(profile)).toBe('warm');
    });

    it('should identify hot users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 60,
        interactionCount: 100,
        contentViewCount: 80,
        completionCount: 50,
      };

      expect(service.getUserStage(profile)).toBe('hot');
    });
  });

  describe('getStrategies', () => {
    it('should return trending and popular for cold users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 2,
        interactionCount: 3,
        contentViewCount: 2,
        completionCount: 0,
      };

      const strategies = service.getStrategies(profile);

      expect(strategies.some((s) => s.type === 'trending')).toBe(true);
      expect(strategies.some((s) => s.type === 'popular')).toBe(true);
    });

    it('should return personalized for hot users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 90,
        interactionCount: 200,
        contentViewCount: 150,
        completionCount: 100,
      };

      const strategies = service.getStrategies(profile);

      expect(strategies.some((s) => s.type === 'personalized')).toBe(true);
    });

    it('should include demographic strategy when available', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 2,
        interactionCount: 3,
        contentViewCount: 2,
        completionCount: 0,
        demographics: { country: 'Nigeria' },
      };

      const strategies = service.getStrategies(profile);

      expect(strategies.some((s) => s.type === 'demographic')).toBe(true);
    });
  });

  describe('getInitialContent', () => {
    it('should return trending and popular for cold users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 1,
        interactionCount: 0,
        contentViewCount: 0,
        completionCount: 0,
      };

      const content = service.getInitialContent(profile);

      expect(content.trending).toBe(true);
      expect(content.popular).toBe(true);
      expect(content.limit).toBe(20);
    });

    it('should return lower limit for hot users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 60,
        interactionCount: 100,
        contentViewCount: 80,
        completionCount: 50,
      };

      const content = service.getInitialContent(profile);

      expect(content.limit).toBe(10);
    });
  });

  describe('getPersonalizationConfidence', () => {
    it('should return low confidence for cold users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 2,
        interactionCount: 3,
        contentViewCount: 2,
        completionCount: 0,
      };

      expect(service.getPersonalizationConfidence(profile)).toBe(0.1);
    });

    it('should return high confidence for hot users', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 90,
        interactionCount: 200,
        contentViewCount: 150,
        completionCount: 100,
      };

      expect(service.getPersonalizationConfidence(profile)).toBeGreaterThan(0.5);
    });
  });

  describe('needsOnboarding', () => {
    it('should require onboarding for new users with no interactions', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 0,
        interactionCount: 0,
        contentViewCount: 0,
        completionCount: 0,
      };

      expect(service.needsOnboarding(profile)).toBe(true);
    });

    it('should not require onboarding for users with interactions', () => {
      const profile = {
        userId: 'user-1',
        accountAgeDays: 1,
        interactionCount: 5,
        contentViewCount: 3,
        completionCount: 1,
      };

      expect(service.needsOnboarding(profile)).toBe(false);
    });
  });

  describe('getOnboardingPreferences', () => {
    it('should return preference questions', () => {
      const preferences = service.getOnboardingPreferences();

      expect(preferences.length).toBe(3);
      expect(preferences.some((p) => p.id === 'genres')).toBe(true);
      expect(preferences.some((p) => p.id === 'universes')).toBe(true);
      expect(preferences.some((p) => p.id === 'contentTypes')).toBe(true);
    });
  });
});
