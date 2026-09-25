// classifyPollFailure is pure; stub the client module so importing
// device-auth doesn't pull the expo-constants/certificate-pinning chain.
jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { classifyPollFailure } from '../device-auth';

describe('classifyPollFailure (C3 device-link poll error contract)', () => {
  it('treats 401 as terminal (code unknown, consumed, or revoked)', () => {
    expect(classifyPollFailure(401)).toBe('terminal');
  });

  it('treats 403 as terminal (auth_device_link flag off denies public endpoints)', () => {
    expect(classifyPollFailure(403)).toBe('terminal');
  });

  it('treats 410 as expired (friendlier UX state than a generic error)', () => {
    expect(classifyPollFailure(410)).toBe('expired');
  });

  it('treats 5xx as transient (server outage must not end the flow)', () => {
    expect(classifyPollFailure(500)).toBe('transient');
    expect(classifyPollFailure(502)).toBe('transient');
    expect(classifyPollFailure(503)).toBe('transient');
  });

  it('treats 429 rate-limiting as transient', () => {
    expect(classifyPollFailure(429)).toBe('transient');
  });

  it('treats network-level errors (no HTTP status) as transient', () => {
    expect(classifyPollFailure(undefined)).toBe('transient');
    expect(classifyPollFailure(0)).toBe('transient');
  });

  it('treats request timeouts as transient (client maps to 408)', () => {
    expect(classifyPollFailure(408)).toBe('transient');
  });

  it('never treats unknown 4xx as terminal except 401/403 (fail open to retry)', () => {
    expect(classifyPollFailure(400)).toBe('transient');
    expect(classifyPollFailure(404)).toBe('transient');
  });
});
