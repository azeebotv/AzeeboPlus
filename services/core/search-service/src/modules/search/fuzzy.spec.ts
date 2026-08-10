import {
  levenshtein,
  similarity,
  tokenize,
  fuzzyScore,
  blendScore,
  scoreFuzzyCandidate,
  FUZZY_MATCH_THRESHOLD,
} from './fuzzy';

describe('fuzzy matching', () => {
  describe('levenshtein', () => {
    it('returns 0 for identical strings', () => {
      expect(levenshtein('avengers', 'avengers')).toBe(0);
      expect(levenshtein('', '')).toBe(0);
    });

    it('handles insertions, deletions and substitutions', () => {
      expect(levenshtein('avngers', 'avengers')).toBe(1); // insertion
      expect(levenshtein('avengers', 'avngers')).toBe(1); // deletion
      expect(levenshtein('cat', 'cut')).toBe(1); // substitution
      expect(levenshtein('spidrman', 'spider-man')).toBe(2);
    });

    it('is case-insensitive', () => {
      expect(levenshtein('AVENGERS', 'avengers')).toBe(0);
    });
  });

  describe('similarity', () => {
    it('normalizes distance into [0, 1]', () => {
      expect(similarity('avengers', 'avengers')).toBe(1);
      expect(similarity('abc', 'xyz')).toBe(0);
      expect(similarity('avngers', 'avengers')).toBeCloseTo(0.875);
    });
  });

  describe('tokenize', () => {
    it('splits on non-alphanumeric and drops short tokens', () => {
      expect(tokenize('Avengers: Endgame (2020)')).toEqual(['avengers', 'endgame', '2020']);
      expect(tokenize('ab')).toEqual([]); // below min length
    });
  });

  describe('fuzzyScore', () => {
    it('scores exact matches highest', () => {
      expect(fuzzyScore('avengers', 'Avengers')).toBe(1);
    });

    it('detects substring matches', () => {
      expect(fuzzyScore('avenger', 'The Avengers Movie')).toBeGreaterThanOrEqual(0.85);
    });

    it('scores simple typos above the threshold', () => {
      expect(fuzzyScore('avngers', 'Avengers')).toBeGreaterThan(FUZZY_MATCH_THRESHOLD);
      expect(fuzzyScore('spidr-man', 'Spider-Man')).toBeGreaterThan(FUZZY_MATCH_THRESHOLD);
    });

    it('scores token-level matches (multi-word titles)', () => {
      expect(fuzzyScore('avngers', 'Avengers Endgame')).toBeGreaterThan(FUZZY_MATCH_THRESHOLD);
    });

    it('rejects unrelated text', () => {
      expect(fuzzyScore('avngers', 'Zebra Finance Report')).toBeLessThan(FUZZY_MATCH_THRESHOLD);
      expect(fuzzyScore('apple', 'banana')).toBeLessThan(FUZZY_MATCH_THRESHOLD);
    });

    it('returns 0 for empty inputs', () => {
      expect(fuzzyScore('', 'anything')).toBe(0);
      expect(fuzzyScore('anything', '')).toBe(0);
    });
  });

  describe('blendScore', () => {
    it('keeps decisive matches unchanged (exact / substring anchor)', () => {
      expect(blendScore(1, 0)).toBe(1);
      expect(blendScore(1, 1)).toBe(1);
      expect(blendScore(0.85, 0)).toBe(0.85);
      expect(blendScore(0.9, 0.1)).toBe(0.9); // >= anchor: trigram ignored
    });

    it('blends trigram similarity into typo-correction matches', () => {
      // fuzzy 0.6 + trigram 0.9 => 0.6*0.6 + 0.9*0.4
      expect(blendScore(0.6, 0.9)).toBeCloseTo(0.72);
      expect(blendScore(0.6, 0.4)).toBeCloseTo(0.52);
    });

    it('lets strong n-gram overlap lift a near-miss above its fuzzy score', () => {
      const fuzzy = 0.7875; // 'avngers' vs 'Avengers Endgame' token match
      expect(blendScore(fuzzy, 0.9)).toBeGreaterThan(fuzzy);
      expect(blendScore(fuzzy, 0.9)).toBeLessThanOrEqual(1);
    });

    it('stays within [0, 1]', () => {
      expect(blendScore(0, 0)).toBe(0);
      expect(blendScore(0.5, 1)).toBeLessThanOrEqual(1);
      expect(blendScore(0.5, 1)).toBeGreaterThanOrEqual(0);
    });

    it('honors a custom trigram weight', () => {
      expect(blendScore(0.6, 0.9, 0.8)).toBeCloseTo(0.84); // 0.6*0.2 + 0.9*0.8
      expect(blendScore(0.6, 0.9, 0)).toBe(0.6); // fuzzy-only
      expect(blendScore(0.6, 0.9, 1)).toBe(0.9); // trigram-only
    });

    it('clamps out-of-range weights so a bad flag cannot break the blend', () => {
      expect(blendScore(0.6, 0.9, 5)).toBe(0.9);
      expect(blendScore(0.6, 0.9, -2)).toBe(0.6);
    });
  });

  describe('scoreFuzzyCandidate', () => {
    it('scores the same matched text identically regardless of field position', () => {
      const primary = scoreFuzzyCandidate('avngers', 'Avengers Endgame', '', 0.47, 0);
      const secondary = scoreFuzzyCandidate('avngers', '', 'Avengers Endgame', 0, 0.47);
      // One scale: swapping which field carries the text must not change the
      // score — this is what makes content/creator/universe scores comparable.
      expect(secondary.score).toBe(primary.score);
      expect(primary.score).toBeCloseTo(0.6605);
      expect(primary.fuzzy).toBeCloseTo(0.7875);
      expect(primary.trigram).toBe(0.47);
    });

    it('keeps decisive matches unchanged', () => {
      const exact = scoreFuzzyCandidate('avengers', 'Avengers', '', 0.7, 0);
      expect(exact.score).toBe(1);
      const substring = scoreFuzzyCandidate('avenger', 'The Avengers Movie', '', 0.3, 0);
      expect(substring.score).toBeGreaterThanOrEqual(0.85);
    });

    it('falls back to 0 for missing fields and similarity values', () => {
      const m = scoreFuzzyCandidate('avngers', null, null, null, null);
      expect(m.fuzzy).toBe(0);
      expect(m.trigram).toBe(0);
      expect(m.score).toBe(0);
    });

    it('passes a custom trigram weight through to the blend', () => {
      const m = scoreFuzzyCandidate('avngers', 'Avengers Endgame', '', 0.47, 0, 0.8);
      expect(m.score).toBeCloseTo(0.5335); // 0.2*0.7875 + 0.8*0.47
      expect(m.fuzzy).toBeCloseTo(0.7875);
      expect(m.trigram).toBe(0.47);
    });
  });
});
