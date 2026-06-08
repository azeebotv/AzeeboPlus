export interface ContentResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}
