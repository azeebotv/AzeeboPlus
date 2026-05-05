export interface ModerationResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}
