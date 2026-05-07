export interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  status: string;
  viewCount: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatorResult {
  id: string;
  bio: string | null;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface UniverseResult {
  id: string;
  name: string;
  displayName: string | null;
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
    trending?: Array<{ query: string; count: number }>;
    facets?: Facets;
    query?: string;
    total?: number;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
