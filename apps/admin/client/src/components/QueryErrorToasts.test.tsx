// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import QueryErrorToasts from './QueryErrorToasts';

let fail = true;
const queryFn = vi.fn(async () => {
  if (fail) throw new Error('Borrow partner service unavailable');
  return [{ id: 'bank-1' }];
});

function Harness() {
  useQuery({ queryKey: ['admin', 'partner-banks'], queryFn, retry: false });
  return null;
}

function renderHarness(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <Harness />
      <QueryErrorToasts />
    </QueryClientProvider>
  );
}

const clientOptions = { defaultOptions: { queries: { retry: false, gcTime: Infinity } } };

describe('QueryErrorToasts', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    fail = true;
  });

  it('names the failed query instead of leaving the page silently empty', async () => {
    const client = new QueryClient(clientOptions);
    renderHarness(client);

    const surface = await screen.findByRole('status');
    expect(surface.textContent).toContain('partner-banks');
    expect(surface.textContent).toContain('Borrow partner service unavailable');
  });

  it('reports one toast per query key, however often it refails', async () => {
    const client = new QueryClient(clientOptions);
    renderHarness(client);
    await screen.findByRole('status');

    client.invalidateQueries({ queryKey: ['admin', 'partner-banks'] });
    await waitFor(() => expect(queryFn.mock.calls.length).toBeGreaterThan(1));

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);
  });

  it('retries the underlying query', async () => {
    const client = new QueryClient(clientOptions);
    renderHarness(client);
    await screen.findByRole('status');
    const before = queryFn.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(queryFn.mock.calls.length).toBeGreaterThan(before));
  });

  it('clears the toast once the same query succeeds', async () => {
    const client = new QueryClient(clientOptions);
    renderHarness(client);
    await screen.findByRole('status');

    fail = false;
    client.invalidateQueries({ queryKey: ['admin', 'partner-banks'] });
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('labels the toast by the query key, not the internal admin prefix', async () => {
    const client = new QueryClient(clientOptions);
    render(
      <QueryClientProvider client={client}>
        <Wrapper />
        <QueryErrorToasts />
      </QueryClientProvider>
    );
    const surface = await screen.findByRole('status');
    expect(surface.textContent).toContain('settings-roles');
  });
});

function Wrapper() {
  useQuery({
    queryKey: ['admin', 'settings-roles'],
    queryFn: async () => {
      throw new Error('Roles service down');
    },
    retry: false,
  });
  return null;
}
