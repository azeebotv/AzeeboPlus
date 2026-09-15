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
                    <button
                      onClick={() =>
                        updateMutation.mutate({
                          key: s.key,
                          value: coerceToOriginalType(s.value, editValue),
                        })
                      }
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
                    >
                      {String(s.value)}
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
                        setEditValue(String(s.value));
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
