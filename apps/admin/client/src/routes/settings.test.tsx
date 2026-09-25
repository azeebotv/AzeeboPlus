// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from './settings';
import { apiFetch } from '@/lib/api/base';
import type { SystemSetting } from '@/lib/admin-types';

/**
 * Contract tests for the Settings page's Access and Security panels against
 * the admin-backend system-settings controller
 * (src/modules/system-settings/system-settings.controller.ts):
 *
 *   GET    /api/v1/admin/settings                      (all settings, envelope)
 *   GET    /api/v1/admin/settings/access/roles         (settings category 'roles')
 *   PUT    /api/v1/admin/settings/access/roles/:role   (UpdateRoleDto)
 *   GET    /api/v1/admin/settings/access/admins        (settings category 'admins')
 *   POST   /api/v1/admin/settings/access/admins        (AdminUserDto)
 *   DELETE /api/v1/admin/settings/access/admins/:id    (email is the id)
 *   GET    /api/v1/admin/settings/security/ip-rules    ({ whitelist, blacklist, mode, ... })
 *   PUT    /api/v1/admin/settings/security/ip-rules    (UpdateIpRulesDto)
 *
 * The service stores admins/roles as settings rows keyed `admins.<email>` /
 * `roles.<name>` with object values — the panels must parse those keys.
 */

vi.mock('@/lib/api/base', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

const setting = (key: string, value: unknown): SystemSetting =>
  ({
    id: `s-${key}`,
    key,
    value,
    category: key.split('.')[0],
    description: `Setting ${key}`,
    updatedAt: '2026-09-01T00:00:00Z',
  }) as unknown as SystemSetting;

const ALL_SETTINGS = [
  setting('site_name', 'Azeebo+'),
  setting('maintenance_mode', false),
  setting('roles.admin', {
    role: 'admin',
    description: 'Full panel access',
    permissions: { users: ['read'] },
    isActive: true,
  }),
  setting('roles.viewer', {
    role: 'viewer',
    description: 'Read-only',
    permissions: {},
    isActive: true,
  }),
  setting('admins.root@azeebo.tv', {
    email: 'root@azeebo.tv',
    displayName: 'Root Admin',
    role: 'superadmin',
  }),
];

/** Post-mutation calls picked out of the log — invalidation refetches (GETs) race them. */
const callsWithMethod = (method: string) =>
  mockApiFetch.mock.calls.filter(
    ([, init]) => (init as RequestInit | undefined)?.method === method
  );

const bodyOfLast = (method: string): Record<string, unknown> => {
  const calls = callsWithMethod(method);
  const last = calls[calls.length - 1]!;
  return JSON.parse((last[1] as RequestInit).body as string);
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsPage />
    </QueryClientProvider>
  );
}

async function openAccessTab() {
  renderPage();
  fireEvent.click(screen.getByText('access'));
  await screen.findByText('Admin Users');
  return screen;
}

beforeEach(() => {
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation(((endpoint: string) => {
    if (endpoint.includes('/settings/access/admins')) {
      return Promise.resolve({
        success: true,
        data: ALL_SETTINGS.filter((s) => s.key.startsWith('admins.')),
      });
    }
    if (endpoint.includes('/settings/access/roles')) {
      return Promise.resolve({
        success: true,
        data: ALL_SETTINGS.filter((s) => s.key.startsWith('roles.')),
      });
    }
    if (endpoint.includes('/settings/security/ip-rules')) {
      return Promise.resolve({
        success: true,
        data: { whitelist: [], blacklist: [], mode: 'off' },
      });
    }
    if (endpoint.includes('/admin/settings')) {
      return Promise.resolve({ success: true, data: ALL_SETTINGS });
    }
    return Promise.resolve({ success: true, data: {} });
  }) as typeof apiFetch);
});

afterEach(cleanup);

describe('SettingsPage — Access tab: admin users list (admins.<email> keys)', () => {
  it('lists admins parsed from the settings rows with role badges', async () => {
    await openAccessTab();
    expect(await screen.findByText('root@azeebo.tv')).toBeTruthy();
    // Display name and role render inside spans (preceded by " · "), and
    // 'superadmin' also exists as a form <option> — match with regex/span.
    expect(screen.getByText(/Root Admin/)).toBeTruthy();
    expect(screen.getByText('superadmin', { selector: 'span' })).toBeTruthy();
  });

  it('creates an admin via POST with the AdminUserDto shape', async () => {
    await openAccessTab();
    const email = await screen.findByPlaceholderText('ops@azeebo.tv');
    const name = screen.getByPlaceholderText('Ops Lead');

    const setInput = (input: HTMLInputElement, v: string) => {
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      set.call(input, v);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setInput(email as HTMLInputElement, 'new.admin@azeebo.tv');
    setInput(name as HTMLInputElement, 'New Admin');
    fireEvent.click(screen.getByText('Add Admin'));

    await waitFor(() => expect(callsWithMethod('POST')).toHaveLength(1));
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/admin/settings/access/admins',
      expect.objectContaining({ method: 'POST' })
    );
    const body = bodyOfLast('POST');
    expect(body).toMatchObject({
      email: 'new.admin@azeebo.tv',
      displayName: 'New Admin',
      role: 'admin',
      sendInvite: true,
    });
    expect(body.password).toBeUndefined(); // no password typed → not sent
  });

  it('removes an admin via DELETE with the email as the resource id', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    await openAccessTab();
    await screen.findByText('root@azeebo.tv');

    fireEvent.click(screen.getByText('Remove'));
    await waitFor(() => expect(callsWithMethod('DELETE')).toHaveLength(1));
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/admin/settings/access/admins/root%40azeebo.tv',
      expect.objectContaining({ method: 'DELETE' })
    );
    vi.unstubAllGlobals();
  });
});

describe('SettingsPage — Access tab: roles (roles.<name> keys, UpdateRoleDto)', () => {
  it('lists roles parsed from the settings rows', async () => {
    await openAccessTab();
    // Role names exist both as rows and as <option> values — select the spans.
    expect(await screen.findByText('admin', { selector: 'span' })).toBeTruthy();
    expect(screen.getByText(/Full panel access/)).toBeTruthy();
    expect(screen.getByText('viewer', { selector: 'span' })).toBeTruthy();
  });

  it('updates a role via PUT with the required UpdateRoleDto fields', async () => {
    await openAccessTab();
    await screen.findByText(/Full panel access/);

    fireEvent.click(screen.getAllByText('Toggle Active')[0]!);
    await waitFor(() => expect(callsWithMethod('PUT')).toHaveLength(1));
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/admin/settings/access/roles/admin',
      expect.objectContaining({ method: 'PUT' })
    );
    const body = bodyOfLast('PUT');
    expect(body.role).toBe('admin');
    expect(body.permissions).toEqual({ users: ['read'] });
    expect(typeof body.isActive).toBe('boolean');
  });
});

describe('SettingsPage — Security tab: IP rules (UpdateIpRulesDto)', () => {
  const openSecurityTab = async () => {
    renderPage();
    fireEvent.click(screen.getByText('security'));
    await screen.findByText('IP Rules');
  };

  it('loads existing rules into the editors', async () => {
    mockApiFetch.mockImplementation(((endpoint: string) => {
      if (endpoint.includes('/settings/security/ip-rules')) {
        return Promise.resolve({
          success: true,
          data: {
            whitelist: ['203.0.113.0/24'],
            blacklist: ['10.0.0.5'],
            mode: 'whitelist-only',
            rateLimitPerIp: 60,
          },
        });
      }
      if (endpoint.includes('/admin/settings')) {
        return Promise.resolve({ success: true, data: ALL_SETTINGS });
      }
      return Promise.resolve({ success: true, data: {} });
    }) as typeof apiFetch);

    await openSecurityTab();
    const textareas = await screen.findAllByRole('textbox', { selector: 'textarea' } as never);
    expect((textareas[0] as HTMLTextAreaElement).value).toBe('203.0.113.0/24');
    expect((textareas[1] as HTMLTextAreaElement).value).toBe('10.0.0.5');
  });

  it('PUTs newline-split arrays and the selected mode', async () => {
    await openSecurityTab();
    const textareas = screen.getAllByRole('textbox', {
      selector: 'textarea',
    } as never) as HTMLTextAreaElement[];
    const set = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )!.set!;
    const whitelist = textareas[0]!;
    set.call(whitelist, '203.0.113.0/24\n198.51.100.7');
    whitelist.dispatchEvent(new Event('input', { bubbles: true }));

    const mode = screen
      .getAllByRole('combobox')
      .find((s) =>
        [...(s as HTMLSelectElement).options].some((o) => o.value === 'whitelist-only')
      ) as HTMLElement;
    const setSel = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value'
    )!.set!;
    setSel.call(mode, 'whitelist-only');
    mode.dispatchEvent(new Event('change', { bubbles: true }));

    fireEvent.click(screen.getByText('Save IP Rules'));

    await waitFor(() => expect(callsWithMethod('PUT')).toHaveLength(1));
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/admin/settings/security/ip-rules',
      expect.objectContaining({ method: 'PUT' })
    );
    const body = bodyOfLast('PUT');
    expect(body.whitelist).toEqual(['203.0.113.0/24', '198.51.100.7']);
    expect(body.mode).toBe('whitelist-only');
  });
});
