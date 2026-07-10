import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPaymentMethods } from '../payment';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Payment API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let payment: ReturnType<typeof createPaymentMethods>;

  beforeEach(() => {
    client = createMockClient();
    payment = createPaymentMethods(client);
  });

  it('initialize should POST to /api/v1/payments/initialize', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { reference: 'ref-123', authorizationUrl: 'https://pay.com' },
    });

    await payment.initialize({ amount: 5000, currency: 'NGN', email: 'a@b.com' });

    expect(client.request).toHaveBeenCalledWith('/api/v1/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount: 5000, currency: 'NGN', email: 'a@b.com' }),
    });
  });

  it('verify should GET /api/v1/payments/verify', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { status: 'success', amount: 5000, currency: 'NGN', reference: 'ref-123' },
    });

    await payment.verify('ref-123');

    expect(client.request).toHaveBeenCalledWith('/api/v1/payments/verify?reference=ref-123');
  });

  it('getTransactions should GET /api/v1/payments/history', async () => {
    client.request.mockResolvedValue({ success: true, data: { items: [], total: 0 } });

    await payment.getTransactions(1, 20);

    expect(client.request).toHaveBeenCalledWith('/api/v1/payments/history?page=1&limit=20');
  });

  it('getPayment should GET /api/v1/payments/:id', async () => {
    client.request.mockResolvedValue({ success: true, data: { id: 'p1' } });

    await payment.getPayment('p1');

    expect(client.request).toHaveBeenCalledWith('/api/v1/payments/p1');
  });
});
