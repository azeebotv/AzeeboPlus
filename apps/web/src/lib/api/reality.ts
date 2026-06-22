// Reality domain methods

import type { ApiResponse, Contestant, RequestClient } from './base';

export function createRealityMethods(client: RequestClient) {
  return {
    getContestants: async (showId: string): Promise<ApiResponse<Contestant[]>> => {
      return client.request<Contestant[]>(`/api/v1/reality/shows/${showId}/contestants`);
    },
  };
}
