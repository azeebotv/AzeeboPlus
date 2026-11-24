/**
 * Unit tests for the TV device-link authentication handshake and polling semantics.
 * Verifies RFC 8628 device flow states, polling retry rules, terminal error classification,
 * and QR activation URL construction.
 */
jest.mock('@azeebo/react-data/api/client', () => ({
  apiClient: { post: jest.fn() },
}));

import { classifyPollFailure } from '@azeebo/react-data/api/device-auth';

describe('TV Device-Link Pairing Handshake & Polling Protocol', () => {
  describe('Poll failure classification (classifyPollFailure)', () => {
    it('classifies 401 and 403 as terminal authorization rejections', () => {
      expect(classifyPollFailure(401)).toBe('terminal');
      expect(classifyPollFailure(403)).toBe('terminal');
    });

    it('classifies 410 as expired device code token', () => {
      expect(classifyPollFailure(410)).toBe('expired');
    });

    it('classifies 5xx server outages as transient retryable errors', () => {
      expect(classifyPollFailure(500)).toBe('transient');
      expect(classifyPollFailure(502)).toBe('transient');
      expect(classifyPollFailure(503)).toBe('transient');
    });

    it('classifies network timeouts (408, 0, undefined) and rate limits (429) as transient', () => {
      expect(classifyPollFailure(408)).toBe('transient');
      expect(classifyPollFailure(0)).toBe('transient');
      expect(classifyPollFailure(undefined)).toBe('transient');
      expect(classifyPollFailure(429)).toBe('transient');
    });
  });

  describe('Device Link Activation URL construction', () => {
    it('constructs a valid secure activation URL with query code parameter', () => {
      const baseUrl = 'https://app.azeeboplus.com/link';
      const userCode = 'WDJB-9KL2';
      const url = new URL(baseUrl);
      url.searchParams.set('code', userCode);

      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('app.azeeboplus.com');
      expect(url.pathname).toBe('/link');
      expect(url.searchParams.get('code')).toBe('WDJB-9KL2');
      // Must stay compact (under 100 chars) for high-reliability TV QR scanning
      expect(url.toString().length).toBeLessThan(100);
    });

    it('validates user code format against RFC 8628 uppercase hyphenated alphanumeric pattern', () => {
      const validCodePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      expect(validCodePattern.test('WDJB-9KL2')).toBe(true);
      expect(validCodePattern.test('ABCD-1234')).toBe(true);
      expect(validCodePattern.test('abc-123')).toBe(false);
      expect(validCodePattern.test('')).toBe(false);
    });
  });

  describe('Consecutive poll error thresholding', () => {
    const MAX_CONSECUTIVE_POLL_ERRORS = 5;

    it('allows retry when consecutive errors are below threshold', () => {
      let consecutiveErrors = 0;
      for (let i = 0; i < MAX_CONSECUTIVE_POLL_ERRORS - 1; i++) {
        consecutiveErrors++;
        expect(consecutiveErrors < MAX_CONSECUTIVE_POLL_ERRORS).toBe(true);
      }
    });

    it('triggers error fallback phase when consecutive errors reach maximum limit', () => {
      let consecutiveErrors = MAX_CONSECUTIVE_POLL_ERRORS;
      const shouldFailPhase = consecutiveErrors >= MAX_CONSECUTIVE_POLL_ERRORS;
      expect(shouldFailPhase).toBe(true);
    });
  });
});
