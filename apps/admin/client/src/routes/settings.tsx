import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { SystemSetting } from '@/lib/admin-types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('general');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await adminApi.getAllSettings();
      return res.success ? (res.data as SystemSetting[]) : [];
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
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>
        Platform configuration and system settings
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: tab === t ? 'none' : '1px solid #2A1A1A',
              background:
                tab === t ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: tab === t ? '#fff' : '#9A8A7A',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
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
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{s.key}</p>
                {s.description && <p style={{ color: '#9A8A7A', fontSize: 12 }}>{s.description}</p>}
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
                        border: '1px solid #2A1A1A',
                        backgroundColor: '#0D0505',
                        color: '#F5F0EB',
                        fontSize: 13,
                        width: 200,
                      }}
                    />
                    <button
                      onClick={() => updateMutation.mutate({ key: s.key, value: editValue })}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#0D3B2E',
                        color: '#fff',
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
                        border: '1px solid #2A1A1A',
                        background: 'transparent',
                        color: '#9A8A7A',
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
                        color: '#9A8A7A',
                        fontSize: 13,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {String(s.value)}
                    </span>
                    <button
                      onClick={() => {
                        setEditKey(s.key);
                        setEditValue(String(s.value));
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: '1px solid #2A1A1A',
                        background: 'transparent',
                        color: '#E8420A',
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
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>
              No settings in this category
            </p>
          )}
        </div>
      )}
    </div>
  );
}
