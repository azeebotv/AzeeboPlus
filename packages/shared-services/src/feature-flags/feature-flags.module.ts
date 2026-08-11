import { FeatureFlagModule } from '@azeebo/feature-flags';
import type { FeatureFlagConfig } from '@azeebo/feature-flags';
import { DynamicModule } from '@nestjs/common';

/**
 * Convenience wrapper around `@azeebo/feature-flags` FeatureFlagModule.
 *
 * Services may import the package directly (`FeatureFlagModule.register(...)`)
 * or use this shared alias: `FeatureFlagsModule.forRoot({ global: true, ... })`
 * is identical to `FeatureFlagModule.register({ global: true, ... })` and keeps
 * the flag module reachable from every service that already imports
 * `@azeebo/shared-services`.
 */
export class FeatureFlagsModule {
  static forRoot(config: FeatureFlagConfig): DynamicModule {
    return FeatureFlagModule.register(config);
  }

  static register(config: FeatureFlagConfig): DynamicModule {
    return FeatureFlagModule.register(config);
  }
}

export { FeatureFlagModule };
export type { FeatureFlagConfig };
