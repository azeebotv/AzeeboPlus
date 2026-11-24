// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskRouterPage from './task-router';
import { apiFetch } from '@/lib/api/base';
import type { AdminUniverse } from '@/lib/admin-types';

/**
 * Contract tests for the Task Router page against the analytics-service
 * task-router controller (src/modules/task-router/):
 *
 *   POST   /api/v1/analytics/tasks/classifications          (CreateClassificationDto)
 *   PUT    /api/v1/analytics/tasks/classifications/:taskType (UpdateClassificationDto)
 *   DELETE /api/v1/analytics/tasks/classifications/:taskType
 *   GET    /api/v1/analytics/tasks/classifications[?filters]
 *
 * The DB row shape is asserted too: complexityTier (not recommendedTier),
 * automationCandidate/eliminationCandidate booleans (not is*Candidate), and
 * Prisma Decimal cost serializing as a string — all three previously
 * fabricated fields that crashed or always-rendered-empty.
 */

vi.mock('@/lib/api/base', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

const classification = {
  id: 'c1',
  taskType: 'invoice_generation',
  description: 'Generates invoices',
  domain: 'finance',
  workClass: 'A2',
  priority: 'normal',
  complexityTier: 'T2',
  slaHours: 24,
  estimatedCostUsd: '0.0200', // Prisma Decimal → string on the wire
  processStep: 'P4',
  processOwner: 'Finance Ops',
  automationCandidate: true,
  eliminationCandidate: false,
};

const envelope = (data: unknown) => ({ success: true, data });

/** Mutations must be picked out of the call log — invalidation refetches (GETs, no init) race them. */
function callsWithMethod(method: string) {
  return mockApiFetch.mock.calls.filter(
    ([, opts]) => (opts as RequestInit | undefined)?.method === method
  );
}

function bodyOfLast(method: string): Record<string, unknown> {
  const calls = callsWithMethod(method);
  const call = calls[calls.length - 1]!;
  return JSON.parse((call[1] as RequestInit).body as string);
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TaskRouterPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true)
  );
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation(((endpoint: string) => {
    if (endpoint.includes('/classifications/stats')) {
      return Promise.resolve(
        envelope({
          total: 1,
          byClass: { A2: 1 },
          byDomain: { finance: 1 },
          automationCandidates: 1,
          eliminationCandidates: 0,
        })
      );
    }
    if (endpoint.includes('/classifications')) {
      return Promise.resolve(envelope([classification]));
    }
    return Promise.resolve(envelope({}));
  }) as typeof apiFetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TaskRouterPage — list rendering matches the DB row shape', () => {
  it('renders complexityTier (not the fabricated recommendedTier field)', async () => {
    renderPage();
    await screen.findByText('invoice_generation');
    // The "Recommended Tier" column shows the real complexityTier value.
    expect(screen.getByText('T2')).toBeTruthy();
  });

  it('renders the real boolean candidate flags (AUTO from automationCandidate)', async () => {
    renderPage();
    await screen.findByText('invoice_generation');
    expect(screen.getByText('AUTO')).toBeTruthy();
    expect(screen.queryByText('KILL')).toBeNull();
  });

  it('renders string-serialized Decimal cost without crashing', async () => {
    renderPage();
    await screen.findByText('invoice_generation');
    expect(screen.getByText('$0.0200')).toBeTruthy();
  });
});

describe('TaskRouterPage — create contract (CreateClassificationDto)', () => {
  it('POSTs the DTO with required fields and numeric coercion', async () => {
    renderPage();
    await screen.findByText('invoice_generation');

    fireEvent.click(screen.getByText('+ New Classification'));
    const setVal = (el: HTMLInputElement, v: string) => {
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setVal(screen.getByPlaceholderText('e.g. invoice_generation'), 'ui_new_task');
    setVal(screen.getByPlaceholderText('e.g. finance'), 'ops');
    setVal(screen.getByPlaceholderText('24'), '12');
    setVal(screen.getByPlaceholderText('0.0200'), '0.5');
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(callsWithMethod('POST')).toHaveLength(1));
    expect(bodyOfLast('POST')).toMatchObject({
      taskType: 'ui_new_task',
      workClass: 'A2',
      domain: 'ops',
      priority: 'normal',
      complexityTier: 'T2',
      slaHours: 12, // number, not string
      estimatedCostUsd: 0.5,
    });
  });

  it('blocks submission without a task type and never calls the API', async () => {
    renderPage();
    await screen.findByText('invoice_generation');

    fireEvent.click(screen.getByText('+ New Classification'));
    const setVal = (el: HTMLInputElement, v: string) => {
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setVal(screen.getByPlaceholderText('e.g. finance'), 'ops');
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(screen.getByText('Task type is required.')).toBeTruthy());
    expect(callsWithMethod('POST')).toHaveLength(0);
  });
});

describe('TaskRouterPage — edit contract (UpdateClassificationDto)', () => {
  it('PUTs to the encoded business-key URL and never sends the immutable taskType', async () => {
    renderPage();
    await screen.findByText('invoice_generation');

    fireEvent.click(screen.getByText('Edit'));
    // Change priority (the select whose options include 'urgent').
    const priority = screen
      .getAllByRole('combobox')
      .find((s) => [...(s as HTMLSelectElement).options].some((o) => o.value === 'urgent'))!;
    const setSel = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value'
    )!.set!;
    setSel.call(priority, 'high');
    priority.dispatchEvent(new Event('change', { bubbles: true }));
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => expect(callsWithMethod('PUT')).toHaveLength(1));
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/analytics/tasks/classifications/invoice_generation',
      expect.objectContaining({ method: 'PUT' })
    );
    const body = bodyOfLast('PUT');
    expect(body.priority).toBe('high');
    expect(body.taskType).toBeUndefined();
  });
});

describe('TaskRouterPage — delete contract', () => {
  it('DELETEs via the confirmed business-key URL', async () => {
    renderPage();
    await screen.findByText('invoice_generation');

    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(callsWithMethod('DELETE')).toHaveLength(1));
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/analytics/tasks/classifications/invoice_generation',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('does not DELETE when confirm is dismissed', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    );
    renderPage();
    await screen.findByText('invoice_generation');

    fireEvent.click(screen.getByText('Delete'));
    expect(callsWithMethod('DELETE')).toHaveLength(0);
  });
});

// Keep the universe type import referenced for future fixture widening.
void (0 as unknown as AdminUniverse | null);
