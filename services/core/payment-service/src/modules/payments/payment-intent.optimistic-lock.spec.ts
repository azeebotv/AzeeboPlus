import { Prisma } from '../../prisma/client/index.js';
import { tryUpdatePaymentIntent } from './payment-intent.optimistic-lock.js';

const ID = 'pi-1';

function staleWriteError(): Prisma.PrismaClientKnownRequestError {
  // P2025 = RecordNotFound: Prisma raises this when no row matches the
  // `{ id, version }` WHERE clause — i.e. the row moved since it was read.
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: '6.19.3',
  });
}

describe('tryUpdatePaymentIntent (optimistic concurrency on PaymentIntent.version)', () => {
  it('guards the update on the version the caller read and increments it atomically', async () => {
    const update = jest.fn().mockResolvedValue({ id: ID, version: 1 });
    const client = { paymentIntent: { update } };

    const won = await tryUpdatePaymentIntent(client as never, ID, 0, {
      status: 'processing',
      providerReference: 'ref_1',
    });

    expect(won).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: ID, version: 0 },
      data: {
        status: 'processing',
        providerReference: 'ref_1',
        version: { increment: 1 },
      },
    });
  });

  it('rejects a stale write (P2025) and reports false instead of clobbering the row', async () => {
    const update = jest.fn().mockRejectedValue(staleWriteError());
    const client = { paymentIntent: { update } };

    const won = await tryUpdatePaymentIntent(client as never, ID, 2, {
      status: 'completed',
    });

    expect(won).toBe(false);
    expect(update).toHaveBeenCalledWith({
      where: { id: ID, version: 2 },
      data: { status: 'completed', version: { increment: 1 } },
    });
  });

  it('propagates unrelated database errors (fail-closed on anything but P2025)', async () => {
    const update = jest.fn().mockRejectedValue(new Error('connection reset'));
    const client = { paymentIntent: { update } };

    await expect(
      tryUpdatePaymentIntent(client as never, ID, 0, { status: 'failed' })
    ).rejects.toThrow('connection reset');
  });
});
