/**
 * Fuzzy matching utilities for typo-tolerant search (search_typo_tolerance).
 *
 * Pure functions, no dependencies: Levenshtein distance + normalized
 * similarity, token-level best-pair scoring, and substring detection. A
 * candidate scores high when it contains the query, is close to the whole
 * query, or shares a close token with it.
 */

/** Classic DP Levenshtein distance between two strings (case-insensitive). */
export function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  if (s === t) return 0;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;

  let prev = new Array<number>(t.length + 1);
  let curr = new Array<number>(t.length + 1);
  for (let j = 0; j <= t.length; j++) prev[j] = j;

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[t.length];
}

/** Normalized similarity in [0, 1]: 1 - distance / max length. */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Splits text into lowercase alphanumeric tokens of at least minLen chars. */
export function tokenize(text: string, minLen = 3): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= minLen);
}

/** Weight applied to the best token-pair similarity (below whole-string). */
const TOKEN_WEIGHT = 0.9;
/** Score awarded when the query is a plain substring of the candidate text. */
const SUBSTRING_SCORE = 0.85;

/**
 * Matches scoring at/above this are decisive — exact, substring, or near-exact
 * (fuzzyScore keeps its raw value, trigram is ignored). Below it, a match is a
 * typo-correction. Also the threshold for the top-level `suggestedQuery`
 * 'did you mean' hint in the fuzzy search response. Kept in sync with
 * SUBSTRING_SCORE (same anchor).
 */
export const DECISIVE_MATCH_SCORE = SUBSTRING_SCORE;

/**
 * Combined fuzzy score of a candidate text against a query, in [0, 1].
 * - 1.0  — exact whole-string match
 * - 0.85 — query is a substring of the candidate (exact contains match)
 * - ~0.9 — a query token closely matches a candidate token
 * - ~sim — the whole strings are close (typo in the query)
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();
  if (!q || !t) return 0;

  const whole = similarity(q, t);

  let bestToken = 0;
  const qTokens = tokenize(q);
  const tTokens = tokenize(t);
  for (const qt of qTokens) {
    for (const tt of tTokens) {
      const s = similarity(qt, tt);
      if (s > bestToken) bestToken = s;
    }
  }

  const contains = t.includes(q) ? SUBSTRING_SCORE : 0;

  return Math.max(whole, bestToken * TOKEN_WEIGHT, contains);
}

/** Minimum combined score for a candidate to be returned as a fuzzy match. */
export const FUZZY_MATCH_THRESHOLD = 0.5;

/**
 * Default weight applied to pg_trgm similarity() when blending scores.
 * Trigram similarity is the index-backed n-gram overlap computed in Postgres
 * — an explainable, character-level signal that complements the token-level
 * Levenshtein heuristic (fuzzyScore). Runtime-tunable via the
 * search_fuzzy_trigram_weight flag (0.4 = 60% fuzzy / 40% trigram).
 */
export const DEFAULT_TRIGRAM_WEIGHT = 0.4;

/**
 * Blends the in-process fuzzyScore with the row's pg_trgm similarity() into a
 * single explainable relevance score in [0, 1].
 *
 * Piecewise by design: decisive matches (exact / substring / near-exact,
 * fuzzyScore >= DECISIVE_MATCH_SCORE) keep their score unchanged — trigram
 * similarity punishes them because candidates are usually much longer than the
 * query, and they need no correction. Typo-correction matches (the region
 * where the two signals disagree) get a weighted blend, so strong n-gram
 * overlap (e.g. 'avngers' vs 'Avengers') genuinely raises the score.
 */
/** Clamps a runtime weight into [0, 1] so a misconfigured flag can't break
 * the blend. */
function clampWeight(weight: number): number {
  return Math.min(1, Math.max(0, weight));
}

export function blendScore(
  fuzzy: number,
  trigram: number,
  trigramWeight: number = DEFAULT_TRIGRAM_WEIGHT
): number {
  const w = clampWeight(trigramWeight);
  if (fuzzy >= DECISIVE_MATCH_SCORE) return fuzzy;
  return fuzzy * (1 - w) + trigram * w;
}

/** A candidate's scoring components from the shared fuzzy pipeline. */
export interface FuzzyCandidateScore {
  /** Levenshtein-based component in [0, 1] — the admission signal (see
   * FUZZY_MATCH_THRESHOLD). */
  fuzzy: number;
  /** pg_trgm similarity component in [0, 1] (max over the row's *Sim fields). */
  trigram: number;
  /** Blended relevance in [0, 1] — the reported, cross-type comparable score. */
  score: number;
}

/**
 * One scoring pipeline for ALL result types (content titles/descriptions,
 * creator displayNames/bios, universe names/displayNames). Feeding the same
 * matched text through this function yields the same score regardless of which
 * type carries it — that is the cross-type comparability contract clients rely
 * on: a 0.7 creator match is as relevant as a 0.7 content match.
 *
 * Primary/secondary ordering is irrelevant (both are maxed), and missing
 * fields fall back to 0 so the scoring never diverges per type.
 */
export function scoreFuzzyCandidate(
  query: string,
  primary: string | null | undefined,
  secondary: string | null | undefined,
  primarySim: number | null | undefined,
  secondarySim: number | null | undefined,
  trigramWeight: number = DEFAULT_TRIGRAM_WEIGHT
): FuzzyCandidateScore {
  const fuzzy = Math.max(fuzzyScore(query, primary ?? ''), fuzzyScore(query, secondary ?? ''));
  const trigram = Math.max(primarySim ?? 0, secondarySim ?? 0);
  return { fuzzy, trigram, score: blendScore(fuzzy, trigram, trigramWeight) };
}
