'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface PaymentGateway {
  id: string;
  name: string;
  provider: 'paystack' | 'flutterwave' | 'stripe';
  isEnabled: boolean;
  mode: 'live' | 'test';
  transactionFee: number;
  totalProcessed: number;
  successRate: number;
  settings: {
    publicKey: string;
    secretKey: string;
    webhookUrl: string;
    supportedCurrencies: string[];
    minAmount: number;
    maxAmount: number;
  };
}

export default function PaymentGatewaySettingsPage(): JSX.Element {
  const router = useRouter();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async (): Promise<void> => {
    try {
      const response = await api.admin.getPaymentGateways();
      if (response.success && response.data) {
        setGateways(response.data as unknown as PaymentGateway[]);
      }
    } catch (error) {
      webLogger.error('Failed to load payment gateways:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (gatewayId: string, isEnabled: boolean): Promise<void> => {
    try {
      const response = await api.admin.togglePaymentGateway(gatewayId, isEnabled);
      if (response.success) {
        loadGateways();
        alert(`Gateway ${isEnabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        alert(response.message || 'Failed to update gateway');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update gateway';
      alert(message);
    }
  };

  const handleModeChange = async (gatewayId: string, mode: 'live' | 'test'): Promise<void> => {
    try {
      const response = await api.admin.updatePaymentGatewayMode(gatewayId, mode);
      if (response.success) {
        loadGateways();
        alert(`Gateway mode changed to ${mode}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update mode';
      alert(message);
    }
  };

  const getProviderIcon = (provider: string): string => {
    switch (provider) {
      case 'paystack':
        return '💳';
      case 'flutterwave':
        return '🌊';
      case 'stripe':
        return '💎';
      default:
        return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payment gateways...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Payment Gateway Settings</h1>
          </div>
        </div>

        <div className="space-y-6">
          {gateways.map((gateway) => (
            <div key={gateway.id} className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getProviderIcon(gateway.provider)}</span>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{gateway.name}</h2>
                    <p className="text-sm text-muted-foreground capitalize">{gateway.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateway.isEnabled}
                      onChange={(e) => handleToggle(gateway.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleModeChange(gateway.id, 'test')}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                        gateway.mode === 'test'
                          ? 'bg-primary text-white'
                          : 'bg-card border border-border text-foreground'
                      }`}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleModeChange(gateway.id, 'live')}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                        gateway.mode === 'live'
                          ? 'bg-green-500 text-white'
                          : 'bg-card border border-border text-foreground'
                      }`}
                    >
                      Live
                    </button>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Transaction Fee</p>
                  <p className="text-lg font-bold text-foreground mt-2">{gateway.transactionFee}%</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-lg font-bold text-foreground mt-2">{gateway.successRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Processed</p>
                  <p className="text-lg font-bold text-foreground mt-2">₦{gateway.totalProcessed.toLocaleString()}</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Supported Currencies</p>
                  <p className="text-lg font-bold text-foreground mt-2">{gateway.settings.supportedCurrencies.join(', ')}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Public Key</label>
                    <input
                      type="text"
                      defaultValue={gateway.settings.publicKey}
                      className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-sm"
                      placeholder="Enter public key"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Secret Key</label>
                    <input
                      type="password"
                      defaultValue={gateway.settings.secretKey}
                      className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-sm"
                      placeholder="Enter secret key"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Webhook URL</label>
                    <input
                      type="text"
                      defaultValue={gateway.settings.webhookUrl}
                      className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-sm"
                      placeholder="Enter webhook URL"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
