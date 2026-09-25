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
import type { SubscribersData } from '@/lib/creator-types';
import { errorTextStyle } from '@/lib/ui';

export default function SubscribersPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['creator', 'subscribers'],
    queryFn: async () => {
      const res = await creatorApi.getSubscribers();
      return res.success ? (res.data as SubscribersData) : null;
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Subscribers</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>Manage and understand your audience</p>

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : isError ? (
        <p style={errorTextStyle()}>{creatorApi.errorMessage(error)}</p>
      ) : data ? (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 4 }}>Total Subscribers</p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>{data.total.toLocaleString()}</p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 4 }}>Growth (30d)</p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>
                +
                {data.growth.length > 0
                  ? Math.max(
                      0,
                      (data.growth[data.growth.length - 1]?.count ?? 0) -
                        (data.growth[0]?.count ?? 0)
                    )
                  : 0}
              </p>
            </div>
          </div>

          {data.growth.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
                marginBottom: 32,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Subscriber Growth</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A1A1A" />
                  <XAxis dataKey="date" stroke="#9A8A7A" fontSize={12} />
                  <YAxis stroke="#9A8A7A" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--creator-darker)',
                      border: '1px solid var(--creator-border)',
                      borderRadius: 8,
                      color: 'var(--creator-text)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#E8420A"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.demographics.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
                marginBottom: 32,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Demographics</h3>
              {data.demographics.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: i < data.demographics.length - 1 ? '1px solid var(--creator-border-light)' : 'none',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14 }}>{d.region}</span>
                  <div
                    style={{ width: 200, height: 8, borderRadius: 4, backgroundColor: 'var(--creator-surface)' }}
                  >
                    <div
                      style={{
                        width: `${d.percentage}%`,
                        height: '100%',
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #E8420A, #CC1C1C)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--creator-text-muted)', width: 40, textAlign: 'right' }}>
                    {d.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.recentSubscribers.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                Recent Subscribers
              </h3>
              {data.recentSubscribers.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--creator-border-light)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: 'var(--creator-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--creator-orange)',
                    }}
                  >
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>{s.tier} tier</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>
                    {new Date(s.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          No subscriber data available
        </p>
      )}
    </div>
  );
}
