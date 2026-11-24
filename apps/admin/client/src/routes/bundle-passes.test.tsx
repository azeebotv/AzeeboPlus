// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BundlePassesPage from './bundle-passes';
import { apiFetch } from '@/lib/api/base';
import type { BundlePassAdmin } from '@/lib/admin-types';

/**
 * Contract tests for the Bundle Passes page against the subscription-service
 * bundle controller (`@Controller('subscription/bundles')`):
 *
 *   GET    /api/v1/subscription/bundles
 *   POST   /api/v1/subscription/bundles            (CreateBundleDto: name,
 *           description, universeIds[], price, originalPrice, discountPercent,
 *           duration, tier — all required; isActive optional)
 *   DELETE /api/v1/subscription/bundles/:id
 *
 * Validation order is: name → description → universes → numeric fields.
 * The universes fixture uses the `/admin/universes` paginated shape
 * (`{ data: [...], meta }` — NOT `items`).
 */

vi.mock('@/lib/api/base', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

const bundle = (over: Partial<BundlePassAdmin> = {}): BundlePassAdmin => ({
  id: 'b1',
  name: 'Entertainment Bundle',
  description: 'Reality + Comedy + Movies',
  universeIds: ['u-reality', 'u-comedy'],
  price: 2100,
  originalPrice: 3000,
  discountPercent: 30,
  duration: 30,
  isActive: true,
  tier: 'standard',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  ...over,
});

const UNIVERSES = [
  {
    id: 'u-reality',
    name: 'reality',
    displayName: 'Reality TV',
    isEnabled: true,
    sortOrder: 1,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'u-comedy',
    name: 'comedy',
    displayName: 'Comedy',
    isEnabled: true,
    sortOrder: 2,
    createdAt: '',
    updatedAt: '',
  },
];

/** Post-mutation calls picked out of the log — invalidation refetches (GETs) race them. */
const callsWithMethod = (method: string) =>
  mockApiFetch.mock.calls.filter(
    ([, init]) => (init as RequestInit | undefined)?.method === method
  );

const setInput = (input: HTMLInputElement | HTMLTextAreaElement, v: string) => {
  const proto =
    input.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const set = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  set.call(input, v);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <BundlePassesPage />
    </QueryClientProvider>
  );
}

async function openModal() {
  renderPage();
  await screen.findByText('Entertainment Bundle');
  fireEvent.click(screen.getByText('New Bundle'));
  await screen.findByText('Create Bundle');
  // Form field order: [0] name input, [1] description textarea.
  const textboxes = screen.getAllByRole('textbox') as [HTMLInputElement, HTMLTextAreaElement];
  return textboxes;
}

beforeEach(() => {
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation(((endpoint: string) => {
    if (endpoint.includes('/admin/universes')) {
      return Promise.resolve({ success: true, data: { data: UNIVERSES } });
    }
    return Promise.resolve({ success: true, data: [bundle()] });
  }) as typeof apiFetch);
});

afterEach(cleanup);

describe('BundlePassesPage — universes multi-select fixture shape', () => {
  it('renders universe checkboxes from the { data, meta } paginated envelope', async () => {
    await openModal();
    // getByLabelText matches only real <label> wrappers — the bundle chips on
    // the cards behind the modal contain the same display text.
    expect(screen.getByLabelText('Reality TV')).toBeTruthy();
    expect(screen.getByLabelText('Comedy')).toBeTruthy();
    // The legacy hardcoded map + comma-input UI is gone.
    expect(screen.queryByText(/comma-separated/i)).toBeNull();
  });

  it('falls back to the raw id for unknown universe ids', async () => {
    mockApiFetch.mockImplementation(((endpoint: string) => {
      if (endpoint.includes('/admin/universes')) {
        return Promise.resolve({ success: true, data: { data: UNIVERSES } });
      }
      return Promise.resolve({ success: true, data: [bundle({ universeIds: ['u-unknown'] })] });
    }) as typeof apiFetch);

    renderPage();
    await screen.findByText('u-unknown');
  });
});

describe('BundlePassesPage — client-side DTO validation (name → description → universes → numbers)', () => {
  it('disables submit for an empty name and never calls the API', async () => {
    await openModal();
    const btn = screen.getByText('Create Bundle') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(callsWithMethod('POST')).toHaveLength(0);
  });

  it('rejects a bundle with no universes selected (after name + description pass)', async () => {
    const [name, desc] = await openModal();
    setInput(name, 'Some Bundle');
    setInput(desc, 'Some description');
    fireEvent.click(screen.getByText('Create Bundle'));
    expect(await screen.findByText('Select at least one universe.')).toBeTruthy();
    expect(callsWithMethod('POST')).toHaveLength(0);
  });

  it('rejects a discount above 100', async () => {
    const [name, desc] = await openModal();
    setInput(name, 'Some Bundle');
    setInput(desc, 'Some description');
    fireEvent.click(screen.getByLabelText('Reality TV'));
    const numbers = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const num = (i: number) => numbers[i] as HTMLInputElement;
    setInput(num(0), '2500'); // price
    setInput(num(1), '3000'); // original price
    setInput(num(2), '150'); // discount % — invalid
    setInput(num(3), '30'); // duration
    fireEvent.click(screen.getByText('Create Bundle'));
    expect(await screen.findByText('Discount must be between 0 and 100.')).toBeTruthy();
    expect(callsWithMethod('POST')).toHaveLength(0);
  });
});

describe('BundlePassesPage — create contract (CreateBundleDto)', () => {
  it('POSTs the full required-field payload with numeric coercion', async () => {
    const [name, desc] = await openModal();
    setInput(name, 'UI Test Bundle');
    setInput(desc, 'Created by the contract test');
    fireEvent.click(screen.getByLabelText('Reality TV'));

    const numbers = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const num = (i: number) => numbers[i] as HTMLInputElement;
    setInput(num(0), '2500');
    setInput(num(1), '3000');
    setInput(num(2), '15');
    setInput(num(3), '30');
    fireEvent.click(screen.getByText('Create Bundle'));

    await waitFor(() => expect(callsWithMethod('POST').length).toBeGreaterThan(0));
    const postCalls = callsWithMethod('POST');
    const body = JSON.parse((postCalls[postCalls.length - 1]![1] as RequestInit).body as string);
    expect(body).toMatchObject({
      name: 'UI Test Bundle',
      description: 'Created by the contract test',
      universeIds: ['u-reality'],
      price: 2500,
      originalPrice: 3000,
      discountPercent: 15,
      duration: 30,
      tier: 'standard',
      isActive: true,
    });
  });
});

describe('BundlePassesPage — delete contract', () => {
  it('DELETEs after the inline confirm', async () => {
    renderPage();
    await screen.findByText('Entertainment Bundle');

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => expect(callsWithMethod('DELETE')).toHaveLength(1));
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/subscription/bundles/b1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('Cancel keeps the bundle', async () => {
    renderPage();
    await screen.findByText('Entertainment Bundle');

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(callsWithMethod('DELETE')).toHaveLength(0);
  });
});
