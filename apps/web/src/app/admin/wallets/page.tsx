'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminWalletsPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadWallets();
  }, [isAuthenticated, user]);

  const loadWallets = async () => {
    try {
      const response = await api.admin.getWallets();
      if (response.success && response.data) {
        const data = response.data as any;
        setWallets(Array.isArray(data) ? data : data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>User Wallets</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{wallets.length} wallets</p>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #2A1A1A',
              borderTopColor: '#E8420A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : (
        <div className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  {['User', 'Balance', 'Total Earned', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: '#9A8A7A',
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #1A0A0A' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600 }}>{w.username || w.userId}</p>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E8420A' }}>
                      ₦{(w.balance || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9A8A7A' }}>
                      ₦{(w.totalEarned || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor:
                            w.isActive !== false ? 'rgba(13,59,46,0.2)' : 'rgba(204,28,28,0.2)',
                          color: w.isActive !== false ? '#0D3B2E' : '#CC1C1C',
                        }}
                      >
                        {w.isActive !== false ? 'Active' : 'Frozen'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {wallets.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No wallets found</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
