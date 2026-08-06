import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AnalyticsData } from '@/lib/creator-types';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30days');
  const { data, isLoading } = useQuery({
    queryKey: ['creator', 'analytics', period],
    queryFn: async () => {
      const res = await creatorApi.getAnalytics(period);
      return res.success ? (res.data as AnalyticsData) : null;
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Analytics</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>Track your content performance</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['7days', '30days', '90days'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: period === p ? 'none' : '1px solid #2A1A1A',
              background:
                period === p ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: period === p ? '#fff' : '#9A8A7A',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : data ? (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 150,
              }}
            >
              <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 4 }}>Total Views</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{data.totalViews.toLocaleString()}</p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 150,
              }}
            >
              <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 4 }}>Engagement Rate</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{data.engagementRate}%</p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 150,
              }}
            >
              <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 4 }}>Avg Watch Time</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{data.avgWatchTime}</p>
            </div>
          </div>

          {data.viewsOverTime.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                marginBottom: 32,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Views Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A1A1A" />
                  <XAxis dataKey="date" stroke="#9A8A7A" fontSize={12} />
                  <YAxis stroke="#9A8A7A" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#140808',
                      border: '1px solid #2A1A1A',
                      borderRadius: 8,
                      color: '#F5F0EB',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#E8420A"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.topContent.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Top Content</h3>
              {data.topContent.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < data.topContent.length - 1 ? '1px solid #1A0A0A' : 'none',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{item.title}</span>
                  <div style={{ display: 'flex', gap: 16, color: '#9A8A7A', fontSize: 13 }}>
                    <span>{item.views.toLocaleString()} views</span>
                    <span>{item.engagement}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>
          No analytics data available
        </p>
      )}
    </div>
  );
}
