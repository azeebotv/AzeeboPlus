'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminPaymentGatewaysPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [gateways, setGateways] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadGateways();
  }, [isAuthenticated, user]);

  const loadGateways = async () => {
    try {
      const response = await api.admin.getPaymentGateways();
      if (response.success && response.data) {
        const data = response.data as any;
        setGateways(Array.isArray(data) ? data : data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Payment Gateways</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>Manage payment integration settings</p>

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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {gateways.map((gw) => (
            <div key={gw.id} className="az-glass" style={{ padding: 24, borderRadius: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{gw.name}</h3>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: gw.isActive ? '#0D3B2E' : '#CC1C1C',
                  }}
                />
              </div>
              <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 12 }}>
                {gw.description || 'Payment gateway'}
              </p>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9A8A7A' }}>
                <span>{gw.transactionCount || 0} transactions</span>
                <span>₦{(gw.totalVolume || 0).toLocaleString()} volume</span>
              </div>
            </div>
          ))}
          {gateways.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>
              No payment gateways configured
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
