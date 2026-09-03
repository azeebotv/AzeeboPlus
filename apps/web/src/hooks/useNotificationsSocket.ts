'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { webLogger } from '@/lib/logger';

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body?: string;
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface UnreadCountPayload {
  count: number;
}

type EventCallback = (data: unknown) => void;

const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 20;

/**
 * Lightweight WebSocket hook for real-time notifications.
 *
 * Uses native WebSocket API with JSON-based event protocol:
 * - Server sends `{ event: string, data: unknown }` messages
 * - Client sends `{ event: string, data: unknown }` messages
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Auth token passed via first message after connect
 * - Connection state tracking
 * - Event listener management
 */
export function useNotificationsSocket(options?: {
  onNewNotification?: (notification: NotificationPayload) => void;
  onUnreadCount?: (count: number) => void;
  onAllRead?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectDelayRef = useRef(RECONNECT_BASE_DELAY);
  const mountedRef = useRef(true);
  const eventListenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());

  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host =
      process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL ||
      `${protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_NOTIFICATION_WS_PORT || '3006'}`;
    return host;
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = RECONNECT_BASE_DELAY;
        setIsConnected(true);
        options?.onConnect?.();

        // Authenticate with the server
        if (token) {
          ws.send(JSON.stringify({ event: 'authenticate', data: { token } }));
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message = JSON.parse(event.data);
          const { event: eventName, data } = message;

          // Handle built-in events
          switch (eventName) {
            case 'new_notification':
              options?.onNewNotification?.(data as NotificationPayload);
              break;
            case 'unread_count':
              options?.onUnreadCount?.((data as UnreadCountPayload).count);
              break;
            case 'all_read':
              options?.onAllRead?.();
              break;
            case 'authenticated':
              // Connection fully established
              break;
            case 'error':
              webLogger.warn('[WS] Server error:', data);
              break;
          }

          // Fire registered listeners
          const listeners = eventListenersRef.current.get(eventName);
          if (listeners) {
            listeners.forEach((cb) => cb(data));
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;
        options?.onDisconnect?.();

        // Don't reconnect if closed intentionally (code 1000) or auth failed (4001/4002)
        if (event.code === 1000 || event.code === 4001 || event.code === 4002) return;

        // Exponential backoff reconnection
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            reconnectDelayRef.current * Math.pow(1.5, reconnectAttemptsRef.current - 1),
            RECONNECT_MAX_DELAY
          );
          reconnectDelayRef.current = delay;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        // onclose will handle reconnection
      };
    } catch {
      // Connection failed, onclose will handle retry
    }
  }, [getWsUrl, token, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent reconnection
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const on = useCallback((event: string, callback: EventCallback) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)!.add(callback);

    return () => {
      eventListenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  // Connect when user is authenticated
  useEffect(() => {
    mountedRef.current = true;
    if (user) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    isConnected,
    disconnect,
    reconnect: connect,
    on,
  };
}
