import { apiClient } from './client';
import type { ApiResponse } from './auth';

const MEDIA_BASE_URL = apiClient.getBaseURL();

export interface MediaUploadResponse {
  key: string;
  url: string;
  cdnUrl: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  cdnUrl: string;
  expiresIn: number;
}

export interface FileMetadata {
  contentType: string;
  contentLength: number;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export const mediaApi = {
  uploadImage: async (file: FormData): Promise<ApiResponse<MediaUploadResponse>> => {
    const token = apiClient.getToken();
    const response = await fetch(`${MEDIA_BASE_URL}/api/v1/media/upload/image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    const data = await response.json();
    return data;
  },

  uploadVideo: async (file: FormData): Promise<ApiResponse<MediaUploadResponse>> => {
    const token = apiClient.getToken();
    const response = await fetch(`${MEDIA_BASE_URL}/api/v1/media/upload/video`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    const data = await response.json();
    return data;
  },

  uploadAvatar: async (file: FormData): Promise<ApiResponse<MediaUploadResponse>> => {
    const token = apiClient.getToken();
    const response = await fetch(`${MEDIA_BASE_URL}/api/v1/media/upload/avatar`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    const data = await response.json();
    return data;
  },

  getPresignedUploadUrl: async (
    type: 'image' | 'video' | 'audio' | 'document',
    fileId: string,
    extension: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<ApiResponse<PresignedUploadResponse>> => {
    return apiClient.get<ApiResponse<PresignedUploadResponse>>(
      `/api/v1/media/presigned/upload?type=${type}&fileId=${fileId}&extension=${extension}&contentType=${encodeURIComponent(contentType)}&expiresIn=${expiresIn}`
    );
  },

  getPresignedDownloadUrl: async (
    key: string,
    expiresIn = 3600
  ): Promise<ApiResponse<{ url: string; expiresIn: number }>> => {
    return apiClient.get<ApiResponse<{ url: string; expiresIn: number }>>(
      `/api/v1/media/presigned/download?key=${encodeURIComponent(key)}&expiresIn=${expiresIn}`
    );
  },

  getFileMetadata: async (key: string): Promise<ApiResponse<FileMetadata>> => {
    return apiClient.get<ApiResponse<FileMetadata>>(
      `/api/v1/media/metadata?key=${encodeURIComponent(key)}`
    );
  },

  deleteFile: async (key: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/api/v1/media/${encodeURIComponent(key)}`
    );
  },
};
