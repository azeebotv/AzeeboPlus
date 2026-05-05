export interface ComedyResponse {
  success: boolean;
  data?: {
    clips?: unknown[];
    comedians?: unknown[];
    series?: unknown[];
    challenges?: unknown[];
    trending?: unknown[];
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
