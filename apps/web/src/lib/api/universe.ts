// Universe domain methods

import type { ApiResponse, RequestClient, Universe } from './base';

export function createUniverseMethods(client: RequestClient) {
  return {
    getUniverses: async (): Promise<ApiResponse<Universe[]>> => {
      return client.request<Universe[]>('/api/v1/public/universes');
    },

    getUniverse: async (universeId: string): Promise<ApiResponse<Universe>> => {
      return client.request<Universe>(`/api/v1/universe/${universeId}`);
    },
  };
}
