import { useConfirm } from "@/components/ui";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { SystemSetting } from '@/lib/admin-types';
import { unwrapList, asRecord, requireData, assertSuccess, str as asStr } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import QueryErrorBanner from '@/components/QueryErrorBanner';

type SettingTab =
  | 'general'
  | 'access'
  | 'security'
  | 'integrations'
  | 'notifications'
  | 'compliance'
  | 'localization';

interface TabDef {
  id: SettingTab;
  label: string;
  icon: string;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'general', label: 'general', icon: 'settings', description: 'Platform identity, branding, and core operational defaults' },
  { id: 'access', label: 'access', icon: 'users', description: 'Admin user accounts, permissions, and role definitions' },
  { id: 'security', label: 'security', icon: 'shield', description: 'IP whitelisting, blacklisting, and rate limit policies' },
  { id: 'integrations', label: 'integrations', icon: 'sliders', description: 'External gateways, SMS/email relays, and third-party APIs' },
  { id: 'notifications', label: 'notifications', icon: 'bell', description: 'Delivery channels, alerts, and system broadcasts' },
  { id: 'compliance', label: 'compliance', icon: 'checkCircle', description: 'Data privacy, terms enforcement, and retention windows' },
  { id: 'localization', label: 'localization', icon: 'globe', description: 'Currencies, timezone standards, and regional languages' },
];

export default function SettingsPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SettingTab>('general');
  const [search, setSearch] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const handleTest = async (key: string) => {
    const provider = key.includes('.') ? (key.split('.')[1] as string) : key;
    setTestingKey(key);
    try {
      const res = await adminApi.testSettingIntegration(provider);
      const payload = asRecord(res.data);
      const status = asStr(payload.status);
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          ok: res.success && status === 'connected',
          message: res.success
            ? `Connected (${status || 'OK'})`
            : res.message || 'Connection failed',
        },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [key]: { ok: false, message: 'Ping failed' },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const {
    data: settings = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const data = requireData(await adminApi.getAllSettings(), []);
      return unwrapList<SystemSetting>(data).items;
    },
  });

  // ─── Access tab: dedicated roles/admins endpoints ─────────────────────────
  const [adminForm, setAdminForm] = useState({
    email: '',
    displayName: '',
    role: 'admin',
    password: '',
    sendInvite: true,
  });
  const [accessError, setAccessError] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ['admin', 'settings-roles'],
    queryFn: async () => {
      const data = requireData(await adminApi.getAccessRoles(), []);
      return unwrapList<SystemSetting>(data).items;
    },
  });

  const adminsQuery = useQuery({
    queryKey: ['admin', 'settings-admins'],
    queryFn: async () => {
      const data = requireData(await adminApi.getAccessAdmins(), []);
      return unwrapList<SystemSetting>(data).items;
    },
  });

  const invalidateAccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'settings-admins'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'settings-roles'] });
  };

  const createAdminMutation = useMutation({
    mutationFn: () =>
      adminApi.createAccessAdmin({
        email: adminForm.email.trim(),
        displayName: adminForm.displayName.trim(),
        role: adminForm.role,
        ...(adminForm.password ? { password: adminForm.password } : {}),
        sendInvite: adminForm.sendInvite,
      }),
    onSuccess: () => {
      invalidateAccess();
      setAccessError('');
      setAdminForm({ email: '', displayName: '', role: 'admin', password: '', sendInvite: true });
      setShowAddAdmin(false);
    },
    onError: (e: Error) => setAccessError(e.message || 'Failed to create admin'),
  });

  const removeAdminMutation = useMutation({
    mutationFn: (email: string) => adminApi.removeAccessAdmin(email),
    onSuccess: invalidateAccess,
    onError: (e: Error) => setAccessError(e.message || 'Failed to remove admin'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ role, value }: { role: string; value: Record<string, unknown> }) =>
      adminApi.updateAccessRole(role, {
        role,
        permissions: (value.permissions as Record<string, string[]>) ?? {},
        description: typeof value.description === 'string' ? value.description : undefined,
        isActive: value.isActive !== false,
      }),
    onSuccess: invalidateAccess,
    onError: (e: Error) => setAccessError(e.message || 'Failed to update role'),
  });

  // ─── Security tab: dedicated IP-rules endpoint ────────────────────────────
  const [ipForm, setIpForm] = useState({
    whitelist: '',
    blacklist: '',
    mode: 'off',
    rateLimitPerIp: '',
  });
  const [ipLoaded, setIpLoaded] = useState(false);
  const [ipError, setIpError] = useState('');
  const [ipSuccess, setIpSuccess] = useState(false);

  const ipRulesQuery = useQuery({
    queryKey: ['admin', 'settings-ip-rules'],
    queryFn: async () => {
      return asRecord(requireData(await adminApi.getIpRules(), {}));
    },
  });

  if (!ipLoaded && ipRulesQuery.data && Object.keys(ipRulesQuery.data).length > 0) {
    const d = ipRulesQuery.data;
    setIpForm({
      whitelist: Array.isArray(d.whitelist) ? (d.whitelist as string[]).join('\n') : '',
      blacklist: Array.isArray(d.blacklist) ? (d.blacklist as string[]).join('\n') : '',
      mode: typeof d.mode === 'string' ? d.mode : 'off',
      rateLimitPerIp: d.rateLimitPerIp != null ? String(d.rateLimitPerIp) : '',
    });
    setIpLoaded(true);
  }

  const saveIpRulesMutation = useMutation({
    mutationFn: () =>
      adminApi.updateIpRules({
        whitelist: ipForm.whitelist
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        blacklist: ipForm.blacklist
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        mode: ipForm.mode,
        ...(ipForm.rateLimitPerIp !== '' ? { rateLimitPerIp: Number(ipForm.rateLimitPerIp) } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings-ip-rules'] });
      setIpError('');
      setIpSuccess(true);
      setTimeout(() => setIpSuccess(false), 3000);
    },
    onError: (e: Error) => setIpError(e.message || 'Failed to save IP rules'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) =>
      assertSuccess(await adminApi.updateSetting(key, value)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSaveError(null);
      setEditKey(null);
      setTogglingKey(null);
    },
    onError: (e: Error) => {
      setSaveError(e.message || 'Failed to save setting');
      setTogglingKey(null);
    },
  });

  // Direct boolean toggle helper
  const handleToggleBoolean = (key: string, currentValue: boolean) => {
    setTogglingKey(key);
    updateMutation.mutate({ key, value: !currentValue });
  };

  // Export / Import
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const handleExport = async () => {
    const res = await adminApi.exportSettings();
    if (!res.success) {
      setImportFeedback(`Export failed: ${res.message || 'unknown error'}`);
      return;
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `azeebo-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportFeedback('Configuration successfully exported.');
    setTimeout(() => setImportFeedback(null), 4000);
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const res = await adminApi.importSettings(parsed, 'merge');
      setImportFeedback(
        res.success ? 'Settings merged successfully.' : `Import failed: ${res.message || 'unknown error'}`
      );
      if (res.success) queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    } catch {
      setImportFeedback('Import failed: file is not valid JSON.');
    }
    setTimeout(() => setImportFeedback(null), 5000);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void handleImportFile(file);
    };
    input.click();
  };

  function coerceToOriginalType(original: unknown, raw: string): unknown {
    if (typeof original === 'boolean') {
      if (/^(true|false)$/i.test(raw.trim())) return raw.trim().toLowerCase() === 'true';
      return raw;
    }
    if (typeof original === 'number') {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    return raw;
  }

  const isObjectValue = (v: unknown) => typeof v === 'object' && v !== null;
  const displayValue = (v: unknown) => (isObjectValue(v) ? JSON.stringify(v, null, 2) : String(v));

  // Filter settings per category and search query
  const filteredSettings = useMemo(() => {
    return settings.filter((s) => {
      if (s.key.startsWith('_version_') || s.category === '_versions') return false;

      // Category matching
      let categoryMatch = false;
      if (tab === 'general') {
        categoryMatch = !s.category || s.category === 'general' || s.category === 'branding' || s.category === 'performance';
      } else {
        categoryMatch = s.category === tab;
      }
      if (!categoryMatch) return false;

      // Search matching
      if (search) {
        const q = search.toLowerCase();
        const matchesKey = s.key.toLowerCase().includes(q);
        const matchesDesc = s.description ? s.description.toLowerCase().includes(q) : false;
        const matchesVal = displayValue(s.value).toLowerCase().includes(q);
        return matchesKey || matchesDesc || matchesVal;
      }
      return true;
    });
  }, [settings, tab, search]);

  const currentTabDef = TABS.find((t) => t.id === tab) ?? (TABS[0] as TabDef);

  return (
    <div>
      {/* Header with Title and Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 6,
            }}
          >
            <Icon name="settings" size={28} color="var(--admin-orange)" />
            <span>Settings</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Manage platform configuration, access controls, IP firewall, and integration credentials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {importFeedback && (
            <span
              style={{
                color: 'var(--admin-green)',
                backgroundColor: 'rgba(13,59,46,0.3)',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {importFeedback}
            </span>
          )}
          <button
            onClick={() => void handleExport()}
            title="Download full configuration as JSON"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              background: 'var(--admin-surface)',
              color: 'var(--admin-text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 150ms ease',
            }}
          >
            Export
          </button>
          <button
            onClick={handleImportClick}
            title="Import configuration JSON file"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              background: 'var(--admin-surface)',
              color: 'var(--admin-text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 150ms ease',
            }}
          >
            Import
          </button>
        </div>
      </div>

      {/* Modern Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '4px',
          borderRadius: 12,
          backgroundColor: 'var(--admin-surface)',
          border: '1px solid var(--admin-card)',
          overflowX: 'auto',
          marginBottom: 20,
        }}
      >
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSearch('');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: isActive ? 'var(--admin-orange)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--admin-text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
              }}
            >
              <Icon name={t.icon} size={16} color={isActive ? '#ffffff' : 'var(--admin-text-muted)'} />
              <span style={{ textTransform: 'capitalize' }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Subtitle & Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          padding: '0 2px',
        }}
      >
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>
          {currentTabDef.description}
        </p>

        {tab !== 'access' && tab !== 'security' && (
          <div style={{ position: 'relative', minWidth: 260 }}>
            <input
              type="text"
              placeholder={`Search ${currentTabDef.label.toLowerCase()} settings...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                color: 'var(--admin-text)',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      {isError && (
        <QueryErrorBanner
          title="Settings unavailable."
          body="Values below are not loaded, so saving here could overwrite settings you cannot see."
          detail={error?.message}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      )}

      {saveError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--admin-red)',
            backgroundColor: 'rgba(204,28,28,0.12)',
            color: 'var(--admin-red)',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading settings…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* ACCESS TAB */}
          {tab === 'access' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Admin Users Card */}
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>Admin Users</h3>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>
                      Personnel with authorized access to the administrative console.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddAdmin(!showAddAdmin)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: showAddAdmin ? 'var(--admin-dark)' : 'var(--admin-orange)',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {showAddAdmin ? 'Cancel' : '+ Add Admin User'}
                  </button>
                </div>

                {accessError && (
                  <div
                    role="alert"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(204,28,28,0.4)',
                      backgroundColor: 'rgba(204,28,28,0.12)',
                      color: 'var(--admin-red)',
                      fontSize: 12,
                      marginBottom: 14,
                    }}
                  >
                    {accessError}
                  </div>
                )}

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: 'var(--admin-dark)',
                      border: '1px solid var(--admin-card)',
                      marginBottom: 16,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 12,
                      alignItems: 'flex-end',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 4 }}>
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="ops@azeebo.tv"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-card)',
                          backgroundColor: 'var(--admin-surface)',
                          color: 'var(--admin-text)',
                          fontSize: 13,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 4 }}>
                        Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="Ops Lead"
                        value={adminForm.displayName}
                        onChange={(e) => setAdminForm({ ...adminForm, displayName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-card)',
                          backgroundColor: 'var(--admin-surface)',
                          color: 'var(--admin-text)',
                          fontSize: 13,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 4 }}>
                        Role
                      </label>
                      <select
                        value={adminForm.role}
                        onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-card)',
                          backgroundColor: 'var(--admin-surface)',
                          color: 'var(--admin-text)',
                          fontSize: 13,
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                        <option value="viewer">Viewer</option>
                        <option value="moderator">Moderator</option>
                        <option value="analyst">Analyst</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 4 }}>
                        Initial Password (optional)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-card)',
                          backgroundColor: 'var(--admin-surface)',
                          color: 'var(--admin-text)',
                          fontSize: 13,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          if (!adminForm.email.trim() || !adminForm.displayName.trim()) {
                            setAccessError('Email and display name are required.');
                            return;
                          }
                          createAdminMutation.mutate();
                        }}
                        disabled={createAdminMutation.isPending || !adminForm.email}
                        style={{
                          padding: '9px 18px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: 'var(--admin-green)',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {createAdminMutation.isPending ? 'Adding…' : 'Add Admin'}
                      </button>
                    </div>
                  </div>

                {adminsQuery.isLoading ? (
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading admin users…</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(adminsQuery.data ?? []).map((a) => {
                      const v = asRecord(a.value);
                      const email = asStr(v.email) || a.key.replace(/^admins\./, '');
                      const displayName = asStr(v.displayName);
                      const role = asStr(v.role) || 'admin';
                      return (
                        <div
                          key={a.key}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderRadius: 10,
                            border: '1px solid var(--admin-card)',
                            backgroundColor: 'var(--admin-dark)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(232,66,10,0.15)',
                                color: 'var(--admin-orange)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {(displayName || email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{displayName || email}</p>
                              <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>{email}</p>
                            </div>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: 'rgba(59,130,246,0.15)',
                                color: 'var(--admin-blue)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {role}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                            if (await confirm({ title: "Revoke Admin Privileges", message: `Revoke admin privileges for ${email}?`, variant: "danger", isDualControl: true, dualControlNote: "Modifying administrator permissions is an audited governance action." })) {
                                removeAdminMutation.mutate(email);
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: '1px solid rgba(204,28,28,0.3)',
                              background: 'transparent',
                              color: 'var(--admin-red)',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Roles Directory */}
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>Roles & Scopes</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
                  Role templates defining granular capabilities across services.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(rolesQuery.data ?? []).map((r) => {
                    const roleName = r.key.replace(/^roles\./, '');
                    const v = asRecord(r.value);
                    const description = asStr(v.description);
                    const isActive = v.isActive !== false;
                    return (
                      <div
                        key={r.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: '1px solid var(--admin-card)',
                          backgroundColor: 'var(--admin-dark)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{roleName}</span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 600,
                                backgroundColor: isActive ? 'rgba(13,59,46,0.3)' : 'rgba(154,138,122,0.15)',
                                color: isActive ? 'var(--admin-green)' : 'var(--admin-text-muted)',
                              }}
                            >
                              {isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          {description && (
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>{description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => updateRoleMutation.mutate({ role: roleName, value: { ...v, isActive: !isActive } })}
                          disabled={updateRoleMutation.isPending}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            border: '1px solid var(--admin-card)',
                            background: 'transparent',
                            color: isActive ? 'var(--admin-text-muted)' : 'var(--admin-green)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Toggle Active
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & IP TAB */}
          {tab === 'security' && (
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>IP Rules</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>
                  Enforce IP address whitelists, blacklists, and per-origin rate limiting.
                </p>
              </div>

              {ipError && (
                <div
                  role="alert"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(204,28,28,0.4)',
                    backgroundColor: 'rgba(204,28,28,0.12)',
                    color: 'var(--admin-red)',
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  {ipError}
                </div>
              )}

              {ipSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(13,59,46,0.4)',
                    backgroundColor: 'rgba(13,59,46,0.2)',
                    color: 'var(--admin-green)',
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  IP firewall rules updated successfully.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>
                      Whitelist
                    </label>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>1 per line (supports CIDR)</span>
                  </div>
                  <textarea
                    value={ipForm.whitelist}
                    onChange={(e) => setIpForm({ ...ipForm, whitelist: e.target.value })}
                    rows={6}
                    placeholder={'203.0.113.0/24\n198.51.100.7'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>
                      Blacklist
                    </label>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>1 per line (supports CIDR)</span>
                  </div>
                  <textarea
                    value={ipForm.blacklist}
                    onChange={(e) => setIpForm({ ...ipForm, blacklist: e.target.value })}
                    rows={6}
                    placeholder={'10.0.0.5\n192.168.44.0/24'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid var(--admin-card)',
                }}
              >
                <div>
                  <label style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 4 }}>
                    Firewall Enforcement Mode
                  </label>
                  <select
                    value={ipForm.mode}
                    onChange={(e) => setIpForm({ ...ipForm, mode: e.target.value })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      minWidth: 160,
                    }}
                  >
                    <option value="off">Off (Monitoring Only)</option>
                    <option value="whitelist-only">Whitelist Only</option>
                    <option value="blacklist-only">Blacklist Only</option>
                    <option value="enforce">Strict Enforce</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 4 }}>
                    Rate Limit / IP / Minute
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ipForm.rateLimitPerIp}
                    onChange={(e) => setIpForm({ ...ipForm, rateLimitPerIp: e.target.value })}
                    placeholder="60"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      width: 140,
                    }}
                  />
                </div>

                <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                  <button
                    onClick={() => saveIpRulesMutation.mutate()}
                    disabled={saveIpRulesMutation.isPending}
                    style={{
                      padding: '9px 24px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: 'var(--admin-orange)',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {saveIpRulesMutation.isPending ? 'Saving…' : 'Save IP Rules'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GENERAL, NOTIFICATIONS, COMPLIANCE, LOCALIZATION, INTEGRATIONS */}
          {tab !== 'access' && tab !== 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredSettings.map((s) => {
                const isBoolean = typeof s.value === 'boolean';
                const isEditing = editKey === s.key;
                const isToggling = togglingKey === s.key;

                return (
                  <div
                    key={s.key}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      borderRadius: 14,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-surface)',
                      transition: 'border-color 150ms ease',
                    }}
                  >
                    <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <code
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: 'var(--admin-text)',
                            backgroundColor: 'var(--admin-dark)',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {s.key}
                        </code>
                        {s.category && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--admin-text-muted)',
                              textTransform: 'capitalize',
                            }}
                          >
                            · {s.category}
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>
                          {s.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      {/* Direct Boolean Toggle Switch */}
                      {isBoolean && !isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: s.value ? 'rgba(13,59,46,0.3)' : 'rgba(154,138,122,0.15)',
                              color: s.value ? 'var(--admin-green)' : 'var(--admin-text-muted)',
                            }}
                          >
                            {s.value ? 'Enabled' : 'Disabled'}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(s.value)}
                            disabled={isToggling}
                            onClick={() => handleToggleBoolean(s.key, Boolean(s.value))}
                            style={{
                              position: 'relative',
                              width: 44,
                              height: 24,
                              borderRadius: 999,
                              border: 'none',
                              backgroundColor: s.value ? 'var(--admin-orange)' : 'rgba(255,255,255,0.15)',
                              cursor: isToggling ? 'wait' : 'pointer',
                              transition: 'background-color 200ms ease',
                              opacity: isToggling ? 0.6 : 1,
                              padding: 2,
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                display: 'block',
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                transform: s.value ? 'translateX(20px)' : 'translateX(0px)',
                                transition: 'transform 200ms ease',
                              }}
                            />
                          </button>
                        </div>
                      ) : isEditing ? (
                        /* Inline Editor Mode */
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {isObjectValue(s.value) ? (
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              rows={4}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid var(--admin-card)',
                                backgroundColor: 'var(--admin-dark)',
                                color: 'var(--admin-text)',
                                fontSize: 12,
                                width: 340,
                                fontFamily: 'monospace',
                                resize: 'vertical',
                              }}
                            />
                          ) : (
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid var(--admin-card)',
                                backgroundColor: 'var(--admin-dark)',
                                color: 'var(--admin-text)',
                                fontSize: 13,
                                width: 220,
                              }}
                            />
                          )}
                          <button
                            onClick={() => {
                              if (isObjectValue(s.value)) {
                                try {
                                  const parsed = JSON.parse(editValue);
                                  updateMutation.mutate({ key: s.key, value: parsed });
                                } catch {
                                  setSaveError('Invalid JSON format. Please verify syntax.');
                                }
                              } else {
                                updateMutation.mutate({
                                  key: s.key,
                                  value: coerceToOriginalType(s.value, editValue),
                                });
                              }
                            }}
                            disabled={updateMutation.isPending}
                            style={{
                              padding: '7px 14px',
                              borderRadius: 6,
                              border: 'none',
                              backgroundColor: 'var(--admin-emerald)',
                              color: '#ffffff',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditKey(null);
                              setSaveError(null);
                            }}
                            style={{
                              padding: '7px 12px',
                              borderRadius: 6,
                              border: '1px solid var(--admin-card)',
                              background: 'transparent',
                              color: 'var(--admin-text-muted)',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        /* Normal Value Display & Actions */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              color: 'var(--admin-text)',
                              fontSize: 13,
                              maxWidth: 'min(540px, 45vw)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              backgroundColor: 'var(--admin-dark)',
                              padding: '5px 12px',
                              borderRadius: 8,
                              border: '1px solid var(--admin-border)',
                            }}
                            title={displayValue(s.value)}
                          >
                            {displayValue(s.value)}
                          </span>

                          {tab === 'integrations' && (
                            <button
                              onClick={() => handleTest(s.key)}
                              disabled={testingKey === s.key}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 6,
                                border: '1px solid var(--admin-card)',
                                background: testResults[s.key]?.ok ? 'rgba(13,59,46,0.3)' : 'transparent',
                                color: testResults[s.key]?.ok
                                  ? 'var(--admin-green)'
                                  : testResults[s.key]
                                    ? 'var(--admin-red)'
                                    : 'var(--admin-text)',
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: testingKey === s.key ? 'wait' : 'pointer',
                                transition: 'all 150ms ease',
                              }}
                            >
                              {testingKey === s.key
                                ? 'Testing…'
                                : testResults[s.key]
                                  ? testResults[s.key]?.message
                                  : 'Ping Test'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditKey(s.key);
                              setEditValue(displayValue(s.value));
                              setSaveError(null);
                            }}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 6,
                              border: '1px solid var(--admin-card)',
                              background: 'var(--admin-dark)',
                              color: 'var(--admin-orange)',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 150ms ease',
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredSettings.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 48,
                    borderRadius: 14,
                    border: '1px dashed var(--admin-card)',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  <p style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 500 }}>
                    {search ? `No settings match "${search}"` : 'No settings found in this category'}
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {search ? 'Try a different search term or clear the filter.' : 'Settings will appear here once defined.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
