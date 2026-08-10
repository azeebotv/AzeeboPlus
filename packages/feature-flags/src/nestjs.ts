import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService, FeatureFlagConfig, FEATURE_FLAG_KEY } from './core';

/**
 * Deny-by-default route gating. When applied to a handler or controller, the
 * request is denied (403) unless the named flag is enabled for the caller.
 *
 * @example
 * @UseGuards(FeatureFlagGuard)
 * @FeatureFlag('wallet_withdrawals_enabled')
 * async withdraw() { ... }
 */
export const FeatureFlag = (key: string): MethodDecorator & ClassDecorator =>
  SetMetadata(FEATURE_FLAG_KEY, key);

/** Guard that enforces @FeatureFlag decorators (deny-by-default) and legacy header opt-in. */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private featureFlagService: FeatureFlagService,
    private reflector?: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id as string | undefined;
    const anonymousId = request.anonymousId as string | undefined;

    // Deny-by-default: any handler/controller decorated with @FeatureFlag is
    // blocked unless the flag evaluates to true for the caller.
    const flaggedKey = this.reflector?.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (flaggedKey) {
      return this.featureFlagService.isEnabled(flaggedKey, userId, anonymousId);
    }

    // Legacy opt-in: a client may send x-feature-flag to reach experimental
    // endpoints. Absent the header, the request is allowed (opt-in, not gating).
    const headerKey = request.headers['x-feature-flag'] as string | undefined;
    if (!headerKey) {
      return true;
    }
    return this.featureFlagService.isEnabled(headerKey, userId, anonymousId);
  }
}

/** NestJS module for registering feature flag service and guard providers. */
export class FeatureFlagModule {
  static register(config: FeatureFlagConfig) {
    return createFeatureFlagModule(config);
  }
}

export const createFeatureFlagModule = (config: FeatureFlagConfig) => {
  return {
    global: config.global === true,
    module: FeatureFlagModule,
    providers: [
      {
        provide: FeatureFlagService,
        useValue: new FeatureFlagService(config),
      },
      {
        provide: FeatureFlagGuard,
        useFactory: (service: FeatureFlagService, reflector: Reflector) =>
          new FeatureFlagGuard(service, reflector),
        inject: [FeatureFlagService, Reflector],
      },
    ],
    exports: [FeatureFlagService, FeatureFlagGuard],
  };
};
