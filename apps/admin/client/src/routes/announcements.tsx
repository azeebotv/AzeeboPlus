import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { NotificationTemplate } from '@/lib/admin-types';

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const res = await adminApi.getNotificationTemplates();
      return res.success ? (res.data as NotificationTemplate[]) : [];
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Announcements</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{announcements.length} announcements</p>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              style={{
                padding: 16,
                borderRadius: 16,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}
              >
                <h3 style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</h3>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: 'rgba(232,66,10,0.2)',
                    color: '#E8420A',
                  }}
                >
                  {a.type}
                </span>
              </div>
              <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 8 }}>{a.subject}</p>
              <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                Created: {new Date(a.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {announcements.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>
              No announcements found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
