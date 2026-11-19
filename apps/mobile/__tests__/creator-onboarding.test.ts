import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 10: Creator Onboarding & KYC Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates Step 1 profile metadata submission', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        applicationId: 'app-creator-771',
        step: 1,
        status: 'draft',
      },
    });

    const res = await apiClient.post('/api/v1/creator/onboarding/step-1', {
      creatorName: 'Kene Studios',
      primaryUniverse: 'cinemaxis',
      bio: 'Award-winning Nollywood indie filmmaker and animator.',
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/creator/onboarding/step-1', {
      creatorName: 'Kene Studios',
      primaryUniverse: 'cinemaxis',
      bio: 'Award-winning Nollywood indie filmmaker and animator.',
    });
    expect(res.data?.applicationId).toBe('app-creator-771');
  });

  it('completes Step 2 payout verification with Nigerian banking details', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        applicationId: 'app-creator-771',
        bankAccountVerified: true,
        recipientCode: 'RCP_12345678',
      },
    });

    const res = await apiClient.post('/api/v1/creator/onboarding/step-2-payout', {
      applicationId: 'app-creator-771',
      bankCode: '058',
      accountNumber: '0123456789',
      bvn: '22233344455',
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/creator/onboarding/step-2-payout', {
      applicationId: 'app-creator-771',
      bankCode: '058',
      accountNumber: '0123456789',
      bvn: '22233344455',
    });
    expect(res.data?.bankAccountVerified).toBe(true);
  });

  it('finalizes onboarding and submits application for admin review', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        applicationId: 'app-creator-771',
        status: 'pending_review',
        submittedAt: '2026-11-18T14:30:00Z',
      },
    });

    const res = await apiClient.post('/api/v1/creator/onboarding/submit', {
      applicationId: 'app-creator-771',
      agreedToTerms: true,
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/creator/onboarding/submit', {
      applicationId: 'app-creator-771',
      agreedToTerms: true,
    });
    expect(res.data?.status).toBe('pending_review');
  });
});
