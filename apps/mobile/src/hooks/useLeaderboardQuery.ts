import { useQuery } from '@tanstack/react-query';
import { engagementApi, type LeaderboardEntry } from '../api/engagement';

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  list: (timePeriod: string, category: string) =>
    [...leaderboardKeys.all, { timePeriod, category }] as const,
};

export function useLeaderboard(timePeriod = 'weekly', category = 'overall') {
  return useQuery({
    queryKey: leaderboardKeys.list(timePeriod, category),
    queryFn: async () => {
      const response = await engagementApi.getLeaderboard(timePeriod, category);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch leaderboard');
      }
      return response.data as unknown as LeaderboardEntry[];
    },
    staleTime: 30_000,
    retry: 2,
  });
}
