import { apiClient } from './client';

export interface Universe {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: string;
  characterCount: number;
  locationCount: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const universeApi = {
  getUniverses: async (
    page = 1,
    limit = 100
  ): Promise<ApiResponse<PaginatedResponse<Universe>>> => {
    const response = await apiClient.get<PaginatedResponse<Universe>>(
      `/api/v1/universe?page=${page}&limit=${limit}`
    );
    return {
      success: true,
      data: response,
    };
  },
};
