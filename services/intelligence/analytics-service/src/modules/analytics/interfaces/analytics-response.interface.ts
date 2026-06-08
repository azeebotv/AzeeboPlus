export interface AnalyticsResponse {
  success: boolean;
  data?: {
    summary?: unknown;
    dashboard?: unknown;
    funnels?: unknown;
    cohorts?: unknown[];
    kpis?: unknown;
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
