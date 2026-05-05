export interface NotificationResponse {
  success: boolean;
  data?: {
    notifications?: Record<string, unknown>[];
    unreadCount?: number;
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
