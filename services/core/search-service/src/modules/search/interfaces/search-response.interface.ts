export interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  status: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  /** Content type (movie/series/reality/short) — direct column, so clients
   * can filter/search facets without a join. */
  contentType?: string;
  /** Universe name (direct column) — clients render the universe chip without
   * a second lookup. */
  universe?: string;
  /** Thumbnail URL (direct column) — clients render the result card image
   * without a second lookup. */
  thumbnail?: string;
  /** Duration in seconds (direct column) — clients render a duration chip and
   * filter by length without a second lookup. */
  duration?: number;
  /** Per-item relevance (0–1), blended from the in-process Levenshtein
   * fuzzyScore and the row's pg_trgm similarity() — present when
   * search_typo_tolerance is on. Clean/exact matches keep a high score
   * (>= ~0.85); corrected/typo matches blend both signals, so a strong
   * n-gram overlap can lift a near-miss. **One scale across types**: the same
   * shared scoring pipeline (scoreFuzzyCandidate) produces scores for
   * content, creators, and universes, so a 0.7 creator match is as relevant
   * as a 0.7 content match. Clients can use it for rank badges or
   * 'did you mean' hints. */
  score?: number;
  /** The Levenshtein-based component of `score` (0–1) — the 'how close are
   * the strings' signal. Present together with trigramScore on fuzzy results
   * so clients can render a 'matched because' breakdown. */
  fuzzyScore?: number;
  /** The pg_trgm similarity component of `score` (0–1) — the 'how similar
   * are the n-grams' signal from Postgres. */
  trigramScore?: number;
}

export interface CreatorResult {
  id: string;
  bio: string | null;
  user: {
    id: string;
    username: string;
    email: string;
  };
  score?: number;
  /** Levenshtein component of `score` (see SearchResult.fuzzyScore). */
  fuzzyScore?: number;
  /** pg_trgm similarity component of `score` (see SearchResult.trigramScore). */
  trigramScore?: number;
}

export interface UniverseResult {
  id: string;
  name: string;
  displayName: string | null;
  score?: number;
  /** Levenshtein component of `score` (see SearchResult.fuzzyScore). */
  fuzzyScore?: number;
  /** pg_trgm similarity component of `score` (see SearchResult.trigramScore). */
  trigramScore?: number;
}

export interface FacetValue {
  id: string;
  name: string;
  count: number;
}

export interface Facets {
  universes: FacetValue[];
  categories: FacetValue[];
  tags: FacetValue[];
  contentTypes: FacetValue[];
  dateRanges: FacetValue[];
}

export interface SearchResponse {
  success: boolean;
  data?: {
    results?: {
      content: SearchResult[];
      creators: CreatorResult[];
      universes: UniverseResult[];
    };
    suggestions?: string[];
    /** 'Did you mean' hint (fuzzy path only): the best-scoring content match's
     * title when that score is below the decisive-match threshold (~0.85) —
     * i.e. the query was likely a typo-correction. Clients can render this as
     * a one-click re-search. Absent when the top match is decisive or there
     * are no fuzzy matches. */
    suggestedQuery?: string;
    trending?: Array<{ query: string; count: number }>;
    facets?: Facets;
    query?: string;
    total?: number;
    message?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
