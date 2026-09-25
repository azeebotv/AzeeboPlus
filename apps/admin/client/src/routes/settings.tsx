import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { SystemSetting } from '@/lib/admin-types';
import { unwrapList, asRecord, str as asStr } from '@/lib/payload';
import { Icon } from '@/components/Icons';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('general');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>(
    {}
  );

  const handleTest = async (key: string) => {
    // extract provider name e.g. integrations.paystack -> paystack
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

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await adminApi.getAllSettings();
      return res.success ? unwrapList<SystemSetting>(res.data).items : [];
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

  const rolesQuery = useQuery({
    queryKey: ['admin', 'settings-roles'],
    queryFn: async () => {
      const res = await adminApi.getAccessRoles();
      return res.success ? unwrapList<SystemSetting>(res.data).items : [];
    },
  });
  const adminsQuery = useQuery({
    queryKey: ['admin', 'settings-admins'],
    queryFn: async () => {
      const res = await adminApi.getAccessAdmins();
      return res.success ? unwrapList<SystemSetting>(res.data).items : [];
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

  const ipRulesQuery = useQuery({
    queryKey: ['admin', 'settings-ip-rules'],
    queryFn: async () => {
      const res = await adminApi.getIpRules();
      return res.success ? asRecord(res.data) : {};
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
    },
    onError: (e: Error) => setIpError(e.message || 'Failed to save IP rules'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      adminApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setEditKey(null);
    },
  });

  // Export/import + bulk save (backend routes previously unused).
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
    setImportFeedback('Settings exported.');
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const res = await adminApi.importSettings(parsed, 'merge');
      setImportFeedback(
        res.success ? 'Settings imported.' : `Import failed: ${res.message || 'unknown error'}`
      );
      if (res.success) queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    } catch {
      setImportFeedback('Import failed: file is not valid JSON.');
    }
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

  /**
   * The edit input always yields a string, but settings can be boolean or
   * numeric. Restoring the original value's type on save prevents writing
   * "true"/"42" over real boolean/number settings.
   */
  function coerceToOriginalType(original: unknown, raw: string): unknown {
    if (typeof original === 'boolean') {
      if (/^(true|false)$/i.test(raw.trim())) return raw.trim().toLowerCase() === 'true';
      return raw; // let the backend validation reject an invalid boolean
    }
    if (typeof original === 'number') {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    return raw;
  }

  // Object-valued settings (integrations, roles) need a JSON editor — a plain
  // input would stringify the object and destroy its shape on save.
  const isObjectValue = (v: unknown) => typeof v === 'object' && v !== null;
  const displayValue = (v: unknown) => (isObjectValue(v) ? JSON.stringify(v) : String(v));

  const tabs = [
    'general',
    'access',
    'notifications',
    'integrations',
    'compliance',
    'localization',
    'security',
  ];

  const filteredSettings = settings.filter((s) => {
    if (tab === 'general')
      return (
        !s.category ||
        s.category === 'general' ||
        s.category === 'branding' ||
        s.category === 'performance'
      );
    return s.category === tab;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="settings" size={28} color="var(--admin-orange)" />
          <span>Settings</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>
          Platform configuration and system settings
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: tab === t ? 'none' : '1px solid var(--admin-border)',
              background:
                tab === t ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: tab === t ? 'white' : 'var(--admin-text-muted)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {importFeedback && (
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{importFeedback}</span>
          )}
          <button
            onClick={() => void handleExport()}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              background: 'transparent',
              color: 'var(--admin-text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Export
          </button>
          <button
            onClick={handleImportClick}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              background: 'transparent',
              color: 'var(--admin-text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Import
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Access tab panels — dedicated roles/admins endpoints, not flat rows */}
          {tab === 'access' && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                marginBottom: 8,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Admin Users</h3>
              {accessError && (
                <div
                  role="alert"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(204,28,28,0.4)',
                    backgroundColor: 'rgba(204,28,28,0.12)',
                    color: 'var(--admin-red-light)',
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  {accessError}
                </div>
              )}
              {adminsQuery.isLoading ? (
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading admins…</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
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
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--admin-card)',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{email}</span>
                          {displayName && (
                            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                              {' '}
                              · {displayName}
                            </span>
                          )}
                          <span
                            style={{
                              marginLeft: 8,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              backgroundColor: 'rgba(59,130,246,0.15)',
                              color: 'var(--admin-blue)',
                            }}
                          >
                            {role}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove admin "${email}"?`))
                              removeAdminMutation.mutate(email);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--admin-red)',
                            background: 'transparent',
                            color: 'var(--admin-red)',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                  {(adminsQuery.data ?? []).length === 0 && (
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                      No admin users configured.
                    </p>
                  )}
                </div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto auto',
                  gap: 8,
                  alignItems: 'end',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--admin-text-muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="ops@azeebo.tv"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--admin-text-muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Display Name
                  </label>
                  <input
                    value={adminForm.displayName}
                    onChange={(e) => setAdminForm({ ...adminForm, displayName: e.target.value })}
                    placeholder="Ops Lead"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--admin-text-muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Role
                  </label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                    }}
                  >
                    {['admin', 'superadmin', 'viewer'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (!adminForm.email.trim() || !adminForm.displayName.trim())
                      return void setAccessError('Email and display name are required.');
                    createAdminMutation.mutate();
                  }}
                  disabled={createAdminMutation.isPending}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--admin-green)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {createAdminMutation.isPending ? 'Adding…' : 'Add Admin'}
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={adminForm.sendInvite}
                    onChange={(e) => setAdminForm({ ...adminForm, sendInvite: e.target.checked })}
                  />
                  Send invite email (password optional when inviting)
                </label>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 12px' }}>Roles</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(rolesQuery.data ?? []).map((r) => {
                  const roleName = r.key.replace(/^roles\./, '');
                  const v = asRecord(r.value);
                  const description = asStr(v.description);
                  return (
                    <div
                      key={r.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-card)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{roleName}</span>
                        {description && (
                          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                            {' '}
                            · {description}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => updateRoleMutation.mutate({ role: roleName, value: v })}
                        disabled={updateRoleMutation.isPending}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-blue)',
                          background: 'transparent',
                          color: 'var(--admin-blue)',
                          fontSize: 11,
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
          )}

          {/* Security tab panel — dedicated IP-rules editor */}
          {tab === 'security' && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                marginBottom: 8,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>IP Rules</h3>
              {ipError && (
                <div
                  role="alert"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(204,28,28,0.4)',
                    backgroundColor: 'rgba(204,28,28,0.12)',
                    color: 'var(--admin-red-light)',
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  {ipError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--admin-text-muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Whitelist (one IP or CIDR per line)
                  </label>
                  <textarea
                    value={ipForm.whitelist}
                    onChange={(e) => setIpForm({ ...ipForm, whitelist: e.target.value })}
                    rows={4}
                    placeholder={'203.0.113.0/24\n198.51.100.7'}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--admin-text-muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Blacklist (one IP or CIDR per line)
                  </label>
                  <textarea
                    value={ipForm.blacklist}
                    onChange={(e) => setIpForm({ ...ipForm, blacklist: e.target.value })}
                    rows={4}
                    placeholder={'10.0.0.5\n192.168.44.0/24'}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--admin-text-muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Mode
                  </label>
                  <select
                    value={ipForm.mode}
                    onChange={(e) => setIpForm({ ...ipForm, mode: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                    }}
                  >
                    {['off', 'whitelist-only', 'blacklist-only', 'enforce'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--admin-text-muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Rate limit / IP / minute
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ipForm.rateLimitPerIp}
                    onChange={(e) => setIpForm({ ...ipForm, rateLimitPerIp: e.target.value })}
                    placeholder="60"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      width: 140,
                    }}
                  />
                </div>
                <button
                  onClick={() => saveIpRulesMutation.mutate()}
                  disabled={saveIpRulesMutation.isPending}
                  style={{
                    marginLeft: 'auto',
                    padding: '9px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--admin-green)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {saveIpRulesMutation.isPending ? 'Saving…' : 'Save IP Rules'}
                </button>
              </div>
            </div>
          )}

          {filteredSettings.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{s.key}</p>
                {s.description && (
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{s.description}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {editKey === s.key ? (
                  <>
                    {isObjectValue(s.value) ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={3}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-surface)',
                          backgroundColor: 'var(--admin-dark)',
                          color: 'var(--admin-text)',
                          fontSize: 12,
                          width: 320,
                          fontFamily: 'monospace',
                          resize: 'vertical',
                        }}
                      />
                    ) : (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-surface)',
                          backgroundColor: 'var(--admin-dark)',
                          color: 'var(--admin-text)',
                          fontSize: 13,
                          width: 200,
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
                            return; // invalid JSON — keep the editor open
                          }
                        } else {
                          updateMutation.mutate({
                            key: s.key,
                            value: coerceToOriginalType(s.value, editValue),
                          });
                        }
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: 'var(--admin-green)',
                        color: 'white',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditKey(null)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        color: 'var(--admin-text-muted)',
                        fontSize: 13,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
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
                          padding: '4px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-border)',
                          background: 'transparent',
                          color: testResults[s.key]?.ok
                            ? 'var(--admin-emerald)'
                            : testResults[s.key]
                              ? 'var(--admin-red)'
                              : 'var(--admin-text)',
                          fontSize: 12,
                          cursor: testingKey === s.key ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {testingKey === s.key
                          ? 'Testing...'
                          : testResults[s.key]
                            ? testResults[s.key]?.message
                            : 'Test'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditKey(s.key);
                        setEditValue(displayValue(s.value));
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-orange)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {filteredSettings.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No settings in this category
            </p>
          )}
        </div>
      )}
    </div>
  );
}
