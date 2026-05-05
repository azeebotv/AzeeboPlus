export interface SearchResponse {
  success: boolean;
  data?: {
    results?: unknown;
    suggestions?: string[];
    trending?: unknown[];
    facets?: unknown;
    query?: string;
    total?: number;
    message?: string;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
  };
}
