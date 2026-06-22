// Recommendation API types
export interface Recommendation {
  id: string;
  type: 'content' | 'creator' | 'universe';
  score: number;
  data: Record<string, unknown>;
}