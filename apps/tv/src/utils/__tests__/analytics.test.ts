jest.mock('@azeebo/analytics-sdk', () => {
  const track = jest.fn();
  const setUser = jest.fn();
  const clearUser = jest.fn();
  const flush = jest.fn();
  class Analytics {
    track = track;
    setUser = setUser;
    clearUser = clearUser;
    flush = flush;
  }
  return {
    Analytics,
    ConsentCategory: { ESSENTIAL: 'essential', ANALYTICS: 'analytics' },
    __mocks: { track, setUser, clearUser, flush },
  };
});

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} }, executionEnvironment: 'bare' },
  executionEnvironment: { Standalone: 'standalone' },
}));

jest.mock('@azeebo/react-data/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const { analytics } = require('../analytics') as typeof import('../analytics') & {
  // (the sdk mock is reachable through its own import below)
};
const sdkModule = require('@azeebo/analytics-sdk') as {
  __mocks: { track: jest.Mock; setUser: jest.Mock; clearUser: jest.Mock; flush: jest.Mock };
};

describe('TV analytics service (M15)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tags every event with device_type: tv', () => {
    analytics.userLoggedIn('device_link');
    const event = sdkModule.__mocks.track.mock.calls[0][0];
    expect(event.name).toBe('user_logged_in');
    expect(event.properties.device_type).toBe('tv');
    expect(event.properties.method).toBe('device_link');
  });

  it('emits the payment seam events with the right payloads', () => {
    analytics.paymentInitialized(2500, 'paystack');
    analytics.walletFunded(2500, 'paystack');
    analytics.paymentFailed(2500, 'paystack', 'abandoned');

    const names = sdkModule.__mocks.track.mock.calls.map((c) => c[0].name);
    expect(names).toEqual(['payment_initialized', 'wallet_funded', 'payment_failed']);

    const failed = sdkModule.__mocks.track.mock.calls[2][0];
    expect(failed.properties.error).toBe('abandoned');
    expect(failed.properties.amount).toBe(2500);
  });

  it('tracks content watched with content_id', () => {
    analytics.contentWatched('abc-123');
    const event = sdkModule.__mocks.track.mock.calls[0][0];
    expect(event.name).toBe('content_watched');
    expect(event.properties.content_id).toBe('abc-123');
    expect(event.properties.device_type).toBe('tv');
  });

  it('never throws when the SDK rejects a track call', () => {
    sdkModule.__mocks.track.mockImplementationOnce(() => {
      throw new Error('sdk down');
    });
    expect(() => analytics.userLoggedIn('device_link')).not.toThrow();
  });

  it('delegates user lifecycle to the SDK', () => {
    analytics.setUser('user-1');
    analytics.clearUser();
    analytics.flush();
    expect(sdkModule.__mocks.setUser).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(sdkModule.__mocks.clearUser).toHaveBeenCalled();
    expect(sdkModule.__mocks.flush).toHaveBeenCalled();
  });
});
