'use client';

import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function PushNotificationSettings(): React.JSX.Element {
  const { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe } =
    usePushNotifications();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      await subscribe();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsProcessing(true);
    try {
      await unsubscribe();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔔</span>
          <div>
            <h3 className="font-semibold text-foreground">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">Not supported in this browser</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Push notifications require a modern browser with service worker support.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <h3 className="font-semibold text-foreground">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'You will receive push notifications'
                : permission === 'denied'
                  ? 'Notifications blocked in browser settings'
                  : 'Get notified about important updates'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={isProcessing || isLoading}
            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isProcessing ? 'Disabling...' : 'Disable Notifications'}
          </button>
        ) : permission === 'denied' ? (
          <div className="text-sm text-muted-foreground">
            Notifications are blocked. Please enable them in your browser settings.
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={isProcessing || isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isProcessing ? 'Enabling...' : 'Enable Notifications'}
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        <p>You can manage notification preferences in your browser settings at any time.</p>
      </div>
    </div>
  );
}
