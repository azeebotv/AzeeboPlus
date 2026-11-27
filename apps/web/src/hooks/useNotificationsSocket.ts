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
const MAX_RECONNECT_ATTEMPTS = 3;
const POLLING_INTERVAL_MS = 60000; // 1 minute fallback

export function useNotificationsSocket(options?: {
  onNewNotification?: (notification: NotificationPayload) => void;
  onUnreadCount?: (count: number) => void;
  onAllRead?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const { user, token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectDelayRef = useRef(RECONNECT_BASE_DELAY);
  const mountedRef = useRef(true);
  const eventListenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());

  const fetchUnreadCountRest = useCallback(async () => {
    if (!isAuthenticated || !mountedRef.current) return;
    try {
      const headers: Record<string, string> = {};
      // The access token is httpOnly, so a reloaded session has none in JS.
      // The cookie authenticates the request on its own; the header is only a
      // convenience for the in-memory copy right after login.
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/v1/notifications/unread-count', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const count = typeof data?.count === 'number' ? data.count : data?.data?.count;
        if (typeof count === 'number') {
          options?.onUnreadCount?.(count);
        }
      }
    } catch {
      // Best-effort REST poll
    }
  }, [isAuthenticated, token, options]);

  const getWsUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL || null;
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (!isAuthenticated) return; // Only connect if authenticated
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getWsUrl();
    // The socket authenticates with a bearer token, and a reloaded session has
    // none (the access token is httpOnly). Poll over REST instead of opening a
    // socket the server would reject.
    if (!url || !token) {
      // WS endpoint not explicitly configured — fall back directly to REST polling
      fetchUnreadCountRest();
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchUnreadCountRest, POLLING_INTERVAL_MS);
      }
      return;
    }

    try {
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

        // Code 1006 = abnormal closure (e.g. server running Socket.IO instead of raw WS, or offline)
        // If aborted immediately on attempt 0 or 1, back off quickly to REST polling
        if (event.code === 1006 && reconnectAttemptsRef.current >= 1) {
          reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;
          fetchUnreadCountRest();
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchUnreadCountRest, POLLING_INTERVAL_MS);
          }
          return;
        }

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
        } else {
          // Reconnect attempts exhausted — fallback to polling
          fetchUnreadCountRest();
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchUnreadCountRest, POLLING_INTERVAL_MS);
          }
        }
      };

      ws.onerror = () => {
        // onclose will handle reconnection or polling fallback
      };
    } catch {
      // Connection failed, fallback to polling
      fetchUnreadCountRest();
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchUnreadCountRest, POLLING_INTERVAL_MS);
      }
    }
  }, [getWsUrl, isAuthenticated, token, options, fetchUnreadCountRest]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
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

  // Connect when the session is active; the cookie carries auth for the
  // REST fallback, so a JS-readable token is not required.
  useEffect(() => {
    mountedRef.current = true;
    if (isAuthenticated) {
      connect();
      fetchUnreadCountRest();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [isAuthenticated, user, token, connect, disconnect, fetchUnreadCountRest]);

  return {
    isConnected,
    disconnect,
    reconnect: connect,
    on,
  };
}
