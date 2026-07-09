'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ReportBuilderPage(): React.JSX.Element {
  const { isAuthenticated: _isAuthenticated, user: _user } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState({
    title: '',
    type: 'users',
    dateRange: '30d',
    format: 'csv',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await api.admin.createCustomReport({
        name: config.title,
        category: config.type,
        metrics: [{ name: 'count', field: 'id', aggregation: 'count' }],
        dimensions: [{ field: 'createdAt', label: 'Date' }],
        filters: [],
        dateField: 'createdAt',
        dateRange: config.dateRange,
        isPublic: false,
      });
      router.push('/admin/reports');
    } catch {
      /* ignore */
    }
    setIsGenerating(false);
  };

  return (
    <AdminLayout>
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: '#9A8A7A',
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>←</span> Back to Reports
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Report Builder</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Configure and generate custom reports</p>

      <div className="az-glass" style={{ padding: 28, borderRadius: 20, maxWidth: 600 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#9A8A7A',
              }}
            >
              Report Title
            </label>
            <input
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="e.g., Monthly User Report"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 15,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#9A8A7A',
              }}
            >
              Report Type
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['users', 'content', 'revenue', 'engagement', 'creators'].map((type) => (
                <button
                  key={type}
                  onClick={() => setConfig({ ...config, type })}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 999,
                    border: config.type === type ? 'none' : '1px solid #2A1A1A',
                    background:
                      config.type === type
                        ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                        : 'transparent',
                    color: config.type === type ? '#fff' : '#9A8A7A',
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#9A8A7A',
              }}
            >
              Date Range
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                ['7d', '7 Days'],
                ['30d', '30 Days'],
                ['90d', '90 Days'],
                ['1y', '1 Year'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setConfig({ ...config, dateRange: key })}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 12,
                    border: config.dateRange === key ? 'none' : '1px solid #2A1A1A',
                    background:
                      config.dateRange === key
                        ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                        : 'transparent',
                    color: config.dateRange === key ? '#fff' : '#9A8A7A',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#9A8A7A',
              }}
            >
              Export Format
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['csv', 'json', 'pdf'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setConfig({ ...config, format: fmt })}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 12,
                    border: config.format === fmt ? 'none' : '1px solid #2A1A1A',
                    background:
                      config.format === fmt
                        ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                        : 'transparent',
                    color: config.format === fmt ? '#fff' : '#9A8A7A',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !config.title}
            className="az-btn-primary"
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              opacity: isGenerating || !config.title ? 0.5 : 1,
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
