'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface PaymentGateway {
  id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  transactionCount?: number;
  totalVolume?: number;
}

export default function AdminPaymentGatewaysPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const { data: gateways = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'payment-gateways'],
    queryFn: async () => {
      const response = await api.admin.getPaymentGateways();
      if (response.success && response.data) {
        const data = response.data as PaymentGateway[] | { items?: PaymentGateway[] };
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Payment Gateways</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>Manage payment integration settings</p>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="az-glass" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Skeleton width="50%" height="18px" />
                <Skeleton width="10px" height="10px" borderRadius="50%" />
              </div>
              <Skeleton width="80%" height="13px" className="mb-3" />
              <Skeleton width="60%" height="12px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load payment gateways" description="Please try again later" onButtonPress={() => router.refresh()} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {gateways.map((gw) => (
            <div key={gw.id} className="az-glass" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{gw.name}</h3>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: gw.isActive ? '#0D3B2E' : '#CC1C1C' }} />
              </div>
              <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 12 }}>{gw.description || 'Payment gateway'}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9A8A7A' }}>
                <span>{gw.transactionCount || 0} transactions</span>
                <span>₦{(gw.totalVolume || 0).toLocaleString()} volume</span>
              </div>
            </div>
          ))}
          {gateways.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>No payment gateways configured</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
