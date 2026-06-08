export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      displayName: string;
      avatar?: string | null;
      role: string;
    };
    access_token: string;
    refresh_token: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
