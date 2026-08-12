import { Prisma } from '../../prisma/client/index.js';
import { PrismaService } from '../database/prisma.service.js';

/** Any client that can write a payment intent: the service or a transaction. */
export type PaymentIntentClient = PrismaService | Prisma.TransactionClient;

/**
 * Optimistic-concurrency compare-and-set for a payment intent, keyed on the
 * `version` column (migration `20260812000000_payment_intent_version`): the
 * row is updated only when its `version` still equals the version the caller
 * read, and the write atomically increments it.
 *
 * Returns `true` when the write won (the row transitioned), or `false` when
 * the row was modified concurrently since it was read — the caller must NOT
 * apply side effects (wallet credits, analytics, provider calls, follow-up
 * state writes) based on a stale read.
 *
 * Fail-closed: a `version` mismatch surfaces as Prisma's P2025 (RecordNotFound
 * — nothing matched `{ id, version }`), which is translated to `false`; any
 * other database error propagates.
 */
export async function tryUpdatePaymentIntent(
  client: PaymentIntentClient,
  id: string,
  expectedVersion: number,
  data: Prisma.PaymentIntentUpdateInput
): Promise<boolean> {
  try {
    await client.paymentIntent.update({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false;
    }
    throw error;
  }
}
