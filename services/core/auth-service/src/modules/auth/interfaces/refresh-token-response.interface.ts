export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    expiresAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
