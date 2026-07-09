import { FeatureFlagService, FeatureFlagGuard, FeatureFlagModule, createFeatureFlagService } from './index';

describe('FeatureFlagService', () => {
  it('should be defined', () => {
    expect(FeatureFlagService).toBeDefined();
  });

  it('should export FeatureFlagGuard', () => {
    expect(FeatureFlagGuard).toBeDefined();
  });

  it('should export createFeatureFlagService factory', () => {
    expect(typeof createFeatureFlagService).toBe('function');
  });

  it('should export FeatureFlagModule', () => {
    expect(FeatureFlagModule).toBeDefined();
  });
});
