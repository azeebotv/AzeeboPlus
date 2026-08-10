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
    access_token?: string;
    refresh_token?: string;
    /** Set when email verification is required: no tokens are issued until the email is verified. */
    requiresEmailVerification?: boolean;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
