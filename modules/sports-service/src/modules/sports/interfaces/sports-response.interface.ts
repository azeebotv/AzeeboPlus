export interface SportsResponse {
  success: boolean;
  data?: {
    home?: unknown;
    highlights?: unknown[];
    events?: unknown[];
    predictions?: unknown[];
    leaderboard?: unknown[];
    fanBoards?: unknown[];
    contests?: unknown[];
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
