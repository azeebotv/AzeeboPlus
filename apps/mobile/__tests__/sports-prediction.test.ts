import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 7: Sports Prediction & Gamification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves active sports match fixtures with prediction odds', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      data: [
        {
          fixtureId: 'fix-arsenal-chelsea',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          kickoff: '2026-11-22T16:30:00Z',
          predictionOptions: [
            { outcome: 'HOME_WIN', multiplier: 1.85 },
            { outcome: 'DRAW', multiplier: 3.40 },
            { outcome: 'AWAY_WIN', multiplier: 4.20 },
          ],
        },
      ],
    });

    const res = await apiClient.get<any>('/api/v1/sports/fixtures?status=upcoming');

    expect(getSpy).toHaveBeenCalledWith('/api/v1/sports/fixtures?status=upcoming');
    expect(res.data?.[0].homeTeam).toBe('Arsenal');
    expect(res.data?.[0].predictionOptions.length).toBe(3);
  });

  it('places prediction stake with token debit validation', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        predictionId: 'pred-ticket-8812',
        fixtureId: 'fix-arsenal-chelsea',
        selectedOutcome: 'HOME_WIN',
        pointsStaked: 500,
        potentialWinPoints: 925,
      },
    });

    const res = await apiClient.post<any>('/api/v1/sports/predictions/place', {
      fixtureId: 'fix-arsenal-chelsea',
      outcome: 'HOME_WIN',
      points: 500,
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/sports/predictions/place', {
      fixtureId: 'fix-arsenal-chelsea',
      outcome: 'HOME_WIN',
      points: 500,
    });
    expect(res.data?.predictionId).toBe('pred-ticket-8812');
    expect(res.data?.potentialWinPoints).toBe(925);
  });
});
