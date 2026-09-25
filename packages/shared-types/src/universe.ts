/**
 * Canonical universe slugs + universe-scoped key builders.
 *
 * `UNIVERSE_SLUGS` is the single source of truth for the slug VALUES used in
 * nav sentinels (`universe.<slug>.enabled`) and universe-scoped feature flags
 * (`universe.<slug>.<feature>`). The slugs MUST match the content-service
 * `Universe.name` values (the runtime source of truth): the admin per-universe
 * page publishes flags keyed by DB universe name, so a sentinel key is only
 * reachable by clients when its slug === the DB name. Keep the list in sync
 * with the `Universe` union and the seed data (`prisma/seed/universes*.sql`).
 */

/**
 * Canonical universe slugs (content-service `Universe.name`).
 *
 * Note the DB stores singular `movie`/`creator` (nav routes may still be
 * plural — `/movies`, `/creators`). `music` is a reserved slug: no DB universe
 * row exists yet, but the gateway serves `universe.music.enabled` so a future
 * music nav entry can be gated the same way.
 */
export const UNIVERSE_SLUGS = [
  'reality',
  'creator',
  'lifestyle',
  'vertical',
  'movie',
  'games',
  'comedy',
  'sports',
  'music',
] as const;

export type UniverseSlug = (typeof UNIVERSE_SLUGS)[number];

/**
 * Platform universe categories — canonical universe NAMES (content-service
 * `Universe.name` / admin `universes.name`). Derived from `UNIVERSE_SLUGS` so
 * the type-level union can never drift from the runtime slug list.
 */
export type Universe = (typeof UNIVERSE_SLUGS)[number];

/** Nav sentinel key, e.g. `universe.reality.enabled` (web/mobile nav gating). */
export const universeEnabledKey = (slug: string): string => `universe.${slug}.enabled`;

/** Universe-scoped flag key, e.g. `universe.reality.voting_enabled`. */
export const universeFlagKey = (slug: string, feature: string): string =>
  `universe.${slug}.${feature}`;
