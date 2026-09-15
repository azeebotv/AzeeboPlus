import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';

export default function ReportBuilderPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    category: 'users',
    dateRange: '30d',
    format: 'json',
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCustomReport(form),
    onSuccess: () => navigate('/reports'),
  });

  return (
    <div style={{ maxWidth: 600 }}>
      <button
        onClick={() => navigate('/reports')}
        style={{
          marginBottom: 24,
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid var(--admin-surface)',
          background: 'transparent',
          color: 'var(--admin-orange)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 0.15s ease',
        }}
      >
        <Icon name="arrowLeft" size={16} />
        <span>Back to Reports</span>
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Report Builder</h1>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 32 }}>Configure and generate a custom report</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
            Report Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Monthly User Growth"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--admin-surface)',
              backgroundColor: 'var(--admin-dark)',
              color: 'var(--admin-text)',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
            Type
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['users', 'content', 'revenue', 'engagement', 'creators'].map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, category: t })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: form.category === t ? 'none' : '1px solid var(--admin-surface)',
                  background:
                    form.category === t
                      ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                      : 'transparent',
                  color: form.category === t ? 'white' : 'var(--admin-text-muted)',
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
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
            Date Range
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['7d', '30d', '90d', '1y'].map((r) => (
              <button
                key={r}
                onClick={() => setForm({ ...form, dateRange: r })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: form.dateRange === r ? 'none' : '1px solid var(--admin-surface)',
                  background:
                    form.dateRange === r
                      ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                      : 'transparent',
                  color: form.dateRange === r ? 'white' : 'var(--admin-text-muted)',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
            Format
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['json', 'csv', 'pdf'].map((f) => (
              <button
                key={f}
                onClick={() => setForm({ ...form, format: f })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: form.format === f ? 'none' : '1px solid var(--admin-surface)',
                  background:
                    form.format === f
                      ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                      : 'transparent',
                  color: form.format === f ? 'white' : 'var(--admin-text-muted)',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!form.name || createMutation.isPending}
          style={{
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: 15,
            cursor: form.name ? 'pointer' : 'not-allowed',
            opacity: form.name ? 1 : 0.5,
            marginTop: 16,
          }}
        >
          {createMutation.isPending ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
}
