// Public entry — keeps the historical export surface while splitting the
// NestJS-free core (core.ts) from the NestJS glue (nestjs.ts) so the service
// logic can be tested without pulling in @nestjs/*.
export * from './core';
// Explicit re-export: `FeatureFlag` is both the flag type (core) and the route
// decorator (nestjs) — the merged name resolves via this explicit export.
export { FeatureFlag, FeatureFlagGuard, FeatureFlagModule, createFeatureFlagModule } from './nestjs';
export * from './registries';
