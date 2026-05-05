export interface ErrorResponse {
  success: boolean;
  error: {
    statusCode: number;
    error: string;
    message: string | string[];
    timestamp: string;
    path: string;
    method: string;
    stack?: string;
  };
}
