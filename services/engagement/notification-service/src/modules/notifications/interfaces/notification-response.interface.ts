export interface NotificationResponse {
  success: boolean;
  data?: {
    notifications?: Record<string, unknown>[];
    unreadCount?: number;
    message?: string;
    pushTokens?: {
      id: string;
      userId: string;
      createdAt: Date;
      updatedAt: Date;
      token: string;
      deviceType: string;
    }[];
    [key: string]:
      | {
          id: string;
          userId: string;
          createdAt: Date;
          updatedAt: Date;
          token: string;
          deviceType: string;
        }[]
      | unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
