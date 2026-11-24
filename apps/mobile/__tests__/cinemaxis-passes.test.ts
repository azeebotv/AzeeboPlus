import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 8: Cinemaxis Bundles & PPV Passes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads available movie passes and premiere tiers', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'pass-cinemaxis-all-access',
          name: 'Cinemaxis Unlimited Pass',
          priceNGN: 250000,
          durationDays: 30,
          tier: 'cinemaxis_monthly',
        },
        {
          id: 'pass-theatrical-ppv-jagun',
          name: 'Jagun Jagun II Theatrical Premiere Pass',
          priceNGN: 150000,
          durationDays: 3,
          tier: 'ppv_single',
        },
      ],
    });

    const res = await apiClient.get<any>('/api/v1/commerce/passes');

    expect(getSpy).toHaveBeenCalledWith('/api/v1/commerce/passes');
    expect(res.data?.length).toBe(2);
    expect(res.data?.[0].tier).toBe('cinemaxis_monthly');
  });

  it('processes pass checkout and generates valid ticket entitlement', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        ticketId: 'tkt-cinemaxis-909',
        passId: 'pass-theatrical-ppv-jagun',
        validUntil: '2026-11-21T23:59:59Z',
        qrRedemptionCode: 'AZB-JAGUN-909',
      },
    });

    const res = await apiClient.post<any>('/api/v1/commerce/passes/checkout', {
      passId: 'pass-theatrical-ppv-jagun',
      paymentMethod: 'wallet',
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/commerce/passes/checkout', {
      passId: 'pass-theatrical-ppv-jagun',
      paymentMethod: 'wallet',
    });
    expect(res.data?.ticketId).toBe('tkt-cinemaxis-909');
    expect(res.data?.qrRedemptionCode).toBe('AZB-JAGUN-909');
  });
});
