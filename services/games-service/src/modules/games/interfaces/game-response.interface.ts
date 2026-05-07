export interface GameResponse {
  success: boolean;
  data?: {
    home?: unknown;
    dailyChallenge?: unknown;
    leaderboard?: unknown[];
    tournaments?: unknown[];
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
