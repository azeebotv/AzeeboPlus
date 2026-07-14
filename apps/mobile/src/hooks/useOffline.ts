import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { OfflineModeService, OfflineAction } from '../utils/offlineMode';

interface UseOfflineState {
  isOnline: boolean;
  isOfflineMode: boolean;
  cacheSize: number;
  offlineQueueLength: number;
}

export function useOffline() {
  const [state, setState] = useState<UseOfflineState>({
    isOnline: true,
    isOfflineMode: false,
    cacheSize: 0,
    offlineQueueLength: 0,
  });
  const previousOnlineRef = useRef(true);

  useEffect(() => {
    const checkConnection = async () => {
      const online = await OfflineModeService.isOnline();
      const cacheSize = await OfflineModeService.getCacheSize();
      const queue = await OfflineModeService.getOfflineQueue();

      setState({
        isOnline: online,
        isOfflineMode: !online,
        cacheSize,
        offlineQueueLength: queue.length,
      });

      if (online && queue.length > 0) {
        await OfflineModeService.processOfflineQueue();
      }
    };

    checkConnection();

    // Event-based connectivity monitoring — replays queue immediately on reconnect
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected ?? false;
      const wasOffline = !previousOnlineRef.current;
      previousOnlineRef.current = online;

      setState((prev) => ({
        ...prev,
        isOnline: online,
        isOfflineMode: !online,
      }));

      // When coming back online, replay queued operations immediately
      if (online && wasOffline) {
        OfflineModeService.getOfflineQueue().then((queue) => {
          if (queue.length > 0) {
            OfflineModeService.processOfflineQueue().then(() => {
              OfflineModeService.getCacheSize().then((cacheSize) => {
                setState((prev) => ({ ...prev, cacheSize, offlineQueueLength: 0 }));
              });
            });
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const cacheContent = useCallback(
    async (
      key: string,
      data: Record<string, unknown>,
      type: 'content' | 'universe' | 'user' | 'wallet' = 'content'
    ) => {
      await OfflineModeService.cacheContent(key, data, type);
      const cacheSize = await OfflineModeService.getCacheSize();
      setState((prev) => ({ ...prev, cacheSize }));
    },
    []
  );

  const getCachedContent = useCallback(async (key: string) => {
    return await OfflineModeService.getCachedContent(key);
  }, []);

  const clearCache = useCallback(async (key?: string) => {
    await OfflineModeService.clearCache(key);
    const cacheSize = await OfflineModeService.getCacheSize();
    setState((prev) => ({ ...prev, cacheSize }));
  }, []);

  const addToOfflineQueue = useCallback(async (action: OfflineAction) => {
    await OfflineModeService.addToOfflineQueue(action);
    const queue = await OfflineModeService.getOfflineQueue();
    setState((prev) => ({ ...prev, offlineQueueLength: queue.length }));
  }, []);

  return {
    ...state,
    cacheContent,
    getCachedContent,
    clearCache,
    addToOfflineQueue,
  };
}
