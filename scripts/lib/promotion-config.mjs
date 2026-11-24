/**
 * promotion-config.mjs — loading and validation for scripts/promotion-rules.json.
 *
 * Shared by the consumers of the promotion config:
 *   • scripts/check-rule-promotion.mjs (which rules are progression-enforced)
 *   • scripts/check-lint-warning-ratchet.mjs (which rules get per-rule
 *     regression baselines — every rule with a `ratchet` path)
 *
 * Pure module: no ESLint, no git, no network. All paths are resolved
 * relative to the caller-provided root so tests can use fixture trees.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Location of the promotion config, relative to the repo root. */
export const PROMOTION_CONFIG_PATH = 'scripts/promotion-rules.json';

/**
 * Load and validate scripts/promotion-rules.json.
 * Returns { rules: [{ id, ratchet?, exemptWorkspaces? }], warnings: string[] } —
 * recoverable problems (an unresolvable ratchet path) become warnings rather
 * than a hard failure; structural problems throw.
 */
export function loadPromotionConfig(root, configPath = PROMOTION_CONFIG_PATH) {
  const absPath = path.join(root, configPath);
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  } catch (err) {
    throw new Error(`promotion config ${configPath} is unreadable: ${err.message}`);
  }
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rules) || raw.rules.length === 0) {
    throw new Error(`promotion config ${configPath} must be { rules: [{ id, ratchet? }, …] } with at least one entry`);
  }
  const seen = new Set();
  const rules = [];
  const warnings = [];
  for (const entry of raw.rules) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || entry.id.trim() === '') {
      throw new Error(`promotion config ${configPath}: every rules[] entry needs a non-empty string "id"`);
    }
    if (seen.has(entry.id)) {
      throw new Error(`promotion config ${configPath}: duplicate rule id "${entry.id}"`);
    }
    seen.add(entry.id);
    if (entry.ratchet !== undefined && typeof entry.ratchet !== 'string') {
      throw new Error(`promotion config ${configPath}: rules[].ratchet must be a string path, got ${JSON.stringify(entry.ratchet)}`);
    }
    if (
      entry.exemptWorkspaces !== undefined &&
      (!Array.isArray(entry.exemptWorkspaces) ||
        entry.exemptWorkspaces.some((x) => typeof x !== 'string' || x.trim() === ''))
    ) {
      throw new Error(
        `promotion config ${configPath}: rules[].exemptWorkspaces must be an array of non-empty workspace names, got ${JSON.stringify(entry.exemptWorkspaces)}`,
      );
    }
    const rule = { id: entry.id };
    if (entry.ratchet !== undefined) {
      // The DECLARED path always survives — consumers (the ratchet) rely on
      // it to generate missing baselines via --update. A missing file is
      // surfaced as a warning here and handled by each consumer (the
      // ratchet gate exits with "generate it once"; the promotion gate only
      // uses the path for advice text).
      if (!fs.existsSync(path.join(root, entry.ratchet))) {
        warnings.push(`ratchet baseline ${entry.ratchet} (rule "${entry.id}") does not exist — generate it with --update`);
      }
      rule.ratchet = entry.ratchet;
    }
    if (entry.exemptWorkspaces !== undefined) {
      rule.exemptWorkspaces = entry.exemptWorkspaces;
    }
    rules.push(rule);
  }
  return { rules, warnings };
}

/**
 * Resolve which configured rules to check.
 * AZEEBO_LINT_RULE filters to a single listed rule; anything else is an
 * operator error — silently gating an unlisted rule would defeat the
 * config's purpose.
 */
export function selectRules(promotionRules, envRule = process.env.AZEEBO_LINT_RULE) {
  if (envRule === undefined || envRule === '') return promotionRules;
  const match = promotionRules.find((r) => r.id === envRule);
  if (!match) {
    throw new Error(
      `AZEEBO_LINT_RULE="${envRule}" is not promotion-enforced — listed rules: ${promotionRules.map((r) => r.id).join(', ')}`,
    );
  }
  return [match];
}
