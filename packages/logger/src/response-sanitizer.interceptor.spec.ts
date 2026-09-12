import { ResponseSanitizationInterceptor } from './response-sanitizer.interceptor';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

describe('ResponseSanitizationInterceptor', () => {
  const interceptor = new ResponseSanitizationInterceptor();

  function run(payload: unknown): Promise<unknown> {
    return firstValueFrom(
      interceptor.intercept({} as never, { handle: () => of(payload) } as never)
    );
  }

  it('preserves Date instances inside plain objects (regression: dates became {})', async () => {
    const at = new Date('2026-09-10T10:07:51.386Z');
    const result = (await run({
      success: true,
      data: { id: 'tx-1', createdAt: at, updatedAt: at },
    })) as { data: { createdAt: Date } };

    expect(result.data.createdAt).toBeInstanceOf(Date);
    expect(result.data.createdAt.toISOString()).toBe('2026-09-10T10:07:51.386Z');
  });

  it('preserves Dates nested in arrays and still sanitizes plain siblings', async () => {
    const result = (await run({
      data: {
        transactions: [{ id: 'tx-1', createdAt: new Date(0), description: 'tip' }],
        password: 'hunter2',
      },
    })) as { data: { transactions: Array<{ createdAt: Date }>; password?: string } };

    expect(result.data.transactions[0].createdAt).toBeInstanceOf(Date);
    expect(result.data.password).toBeUndefined();
  });

  it('passes a top-level Date response through untouched', async () => {
    const at = new Date();
    const result = await run(at);
    expect(result).toBe(at);
  });

  it('masks string fields as before', async () => {
    const result = (await run({ email: 'someone@example.com' })) as { email: string };
    expect(result.email).toContain('****');
    expect(result.email).not.toBe('someone@example.com');
  });
});
