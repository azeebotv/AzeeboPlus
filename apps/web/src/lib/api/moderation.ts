// Moderation domain methods

import type { ApiResponse, RequestClient } from './base';

export function createModerationMethods(client: RequestClient) {
  return {
    reportContent: async (
      contentId: string,
      reason: string,
      description?: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/moderation/report', {
        method: 'POST',
        body: JSON.stringify({ contentId, reason, description, type: 'report' }),
      });
    },
  };
}
