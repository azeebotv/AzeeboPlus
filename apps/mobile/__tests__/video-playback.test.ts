import { contentApi } from '@azeebo/react-data/api/content';
import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 4: Video Playback, DRM & Signed URLs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves signed HLS manifest URL with time-limited token', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      data: {
        signedUrl: 'https://stream.azeeboplus.com/vod/film-99/master.m3u8?token=exp170000_sigXYZ',
        expiresAt: 1700000000,
        drmScheme: 'fairplay_widevine',
      },
    });

    const res = await contentApi.getSignedUrl('film-99');

    expect(getSpy).toHaveBeenCalledWith('/api/v1/content/film-99/media/signed-url');
    expect(res.data?.signedUrl).toContain('master.m3u8');
    expect(res.data?.signedUrl).toContain('token=');
  });

  it('updates watch progress accurately for cross-device resume', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: { contentId: 'film-99', progressSeconds: 742, completed: false },
    });

    const res = await contentApi.addToWatchHistory('film-99', 742);

    expect(postSpy).toHaveBeenCalledWith('/api/v1/users/me/history', {
      contentId: 'film-99',
      position: 742,
    });
    expect(res.data?.progressSeconds).toBe(742);
  });

  it('handles playback entitlement paywall rejection gracefully', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          code: 'ENTITLEMENT_REQUIRED',
          message: 'Active Cinemaxis pass required to stream this feature.',
          upgradeUrl: '/wallet/subscription-plans',
        },
      },
    });

    await expect(contentApi.getSignedUrl('premium-premiere-01')).rejects.toMatchObject({
      response: {
        status: 403,
        data: { code: 'ENTITLEMENT_REQUIRED' },
      },
    });
  });
});
