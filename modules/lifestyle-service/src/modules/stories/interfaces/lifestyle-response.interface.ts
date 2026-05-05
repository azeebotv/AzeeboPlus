export interface LifestyleResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}
