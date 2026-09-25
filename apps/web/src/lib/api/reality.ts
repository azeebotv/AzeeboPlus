// Reality domain methods

import type { ApiResponse, Contestant, RequestClient } from './base';

export function createRealityMethods(client: RequestClient) {
  return {
    getContestants: async (showId: string): Promise<ApiResponse<Contestant[]>> => {
      return client.request<Contestant[]>(`/api/v1/reality/shows/${showId}/contestants`);
    },

    /**
     * Cast a vote for a contestant. Matches the backend CastVoteDto
     * { contestantId, showId } on POST /votes (50/min). The backend requires
     * a CSRF token for POSTs — RequestClient handles that.
     */
    castVote: async (
      showId: string,
      contestantId: string
    ): Promise<ApiResponse<{ contestantId: string; totalVotes?: number }>> => {
      return client.request(`/api/v1/reality/votes`, {
        method: 'POST',
        body: JSON.stringify({ contestantId, showId }),
      });
    },
  };
}
