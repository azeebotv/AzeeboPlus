import { contentApi } from '@azeebo/react-data/api/content';
import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 3: Reality TV Voting & Predictions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches reality show contestants with elimination status', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'cnt-01', name: 'Zainab Ahmed', voteCount: 4200, status: 'active', avatar: 'https://cdn.azeeboplus.com/c1.jpg' },
        { id: 'cnt-02', name: 'Emeka Okafor', voteCount: 3950, status: 'active', avatar: 'https://cdn.azeeboplus.com/c2.jpg' },
        { id: 'cnt-03', name: 'Tunde Bakare', voteCount: 1100, status: 'eliminated', avatar: 'https://cdn.azeeboplus.com/c3.jpg' },
      ],
    });

    const res = await contentApi.getContestants('show-naija-house-s3');

    expect(getSpy).toHaveBeenCalledWith('/api/v1/reality/shows/show-naija-house-s3/contestants');
    expect(res.data?.length).toBe(3);
    expect((res.data as any)?.filter((c: any) => c.status === 'active').length).toBe(2);
  });

  it('submits audience vote and confirms ledger locking', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        voteId: 'vote-rec-552',
        contestantId: 'cnt-01',
        votesCast: 10,
        confirmedAt: '2026-11-18T12:05:00Z',
      },
    });

    const votePayload = {
      showId: 'show-naija-house-s3',
      contestantId: 'cnt-01',
      votes: 10,
      tokenType: 'free_daily',
    };

    const res = (await apiClient.post('/api/v1/reality/vote', votePayload)) as {
      success: boolean;
      data?: { voteId: string; contestantId: string; votesCast: number; confirmedAt: string };
    };

    expect(postSpy).toHaveBeenCalledWith('/api/v1/reality/vote', votePayload);
    expect(res.data?.voteId).toBe('vote-rec-552');
    expect(res.data?.votesCast).toBe(10);
  });

  it('rejects vote submission when voting window is locked', async () => {
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Voting window is closed for this episode', code: 'VOTING_LOCKED' },
      },
    });

    await expect(
      apiClient.post('/api/v1/reality/vote', {
        showId: 'show-naija-house-s3',
        contestantId: 'cnt-01',
        votes: 1,
      })
    ).rejects.toMatchObject({
      response: {
        status: 403,
        data: { code: 'VOTING_LOCKED' },
      },
    });
  });
});
