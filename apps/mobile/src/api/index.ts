import type { User, AuthResponse, ApiResponse } from './auth';
import type { ContentItem, PaginatedResponse } from './content';
import type { WalletBalance, Transaction } from './wallet';
import type { Notification, NotificationPreferences } from './notification';
import type { MediaUploadResponse, PresignedUploadResponse, FileMetadata } from './media';
import type { Universe } from './universe';

export type { User, AuthResponse, ApiResponse };
export type { ContentItem, PaginatedResponse };
export type { WalletBalance, Transaction };
export type { Notification, NotificationPreferences };
export type { MediaUploadResponse, PresignedUploadResponse, FileMetadata };
export type { Universe };

export { authApi } from './auth';
export { contentApi } from './content';
export { walletApi } from './wallet';
export { paymentApi } from './payment';
export { notificationApi } from './notification';
export { mediaApi } from './media';
export { universeApi } from './universe';
export { apiClient } from './client';
