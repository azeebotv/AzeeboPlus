/**
 * Offline-Safe UX Patterns & Cache Management
 * TAA §6
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  isOffline: boolean;
  lastOnline?: string;
}

const NETWORK_STATE_KEY = 'azeebo_network_state';
const OFFLINE_QUEUE_KEY = 'azeebo_offline_queue';

export async function getNetworkState(): Promise<NetworkState> {
  const state = await NetInfo.fetch();
  const networkState: NetworkState = {
    isConnected: state.isConnected ?? false,
    type: state.type,
    isWifi: state.type === 'wifi',
    isCellular: state.type === 'cellular',
    isOffline: !(state.isConnected ?? false),
    lastOnline: state.isConnected ? new Date().toISOString() : undefined,
  };
  await AsyncStorage.setItem(NETWORK_STATE_KEY, JSON.stringify(networkState));
  return networkState;
}

export async function getCachedState<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(`offline_cache_${key}`);
    if (!cached) return null;
    const { data, expiry } = JSON.parse(cached);
    if (expiry && new Date(expiry) < new Date()) {
      await AsyncStorage.removeItem(`offline_cache_${key}`);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export async function setCachedState<T>(
  key: string,
  data: T,
  ttlMs: number = 300000
): Promise<void> {
  const entry = { data, expiry: new Date(Date.now() + ttlMs).toISOString() };
  await AsyncStorage.setItem(`offline_cache_${key}`, JSON.stringify(entry));
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export async function queueOfflineAction(type: string, payload: unknown): Promise<void> {
  const queue = await getOfflineQueue();
  const action: OfflineAction = {
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 3,
  };
  queue.push(action);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function processOfflineQueue(
  processor: (action: OfflineAction) => Promise<boolean>
): Promise<void> {
  const queue = await getOfflineQueue();
  const remaining: OfflineAction[] = [];
  for (const action of queue) {
    try {
      const success = await processor(action);
      if (!success && action.retryCount < action.maxRetries) {
        remaining.push({ ...action, retryCount: action.retryCount + 1 });
      }
    } catch {
      if (action.retryCount < action.maxRetries) {
        remaining.push({ ...action, retryCount: action.retryCount + 1 });
      }
    }
  }
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}

export function getCacheKey(prefix: string, params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${prefix}:${sorted.map(([k, v]) => `${k}=${v}`).join('&')}`;
}

export async function clearExpiredCache(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith('offline_cache_'));
  let cleared = 0;
  for (const key of cacheKeys) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const { expiry } = JSON.parse(raw);
        if (expiry && new Date(expiry) < new Date()) {
          await AsyncStorage.removeItem(key);
          cleared++;
        }
      }
    } catch {
      await AsyncStorage.removeItem(key);
      cleared++;
    }
  }
  return cleared;
}

export function calculateStaleTime(freshnessMs: number, lastFetched?: string): number {
  if (!lastFetched) return 0;
  const elapsed = Date.now() - new Date(lastFetched).getTime();
  return Math.max(0, freshnessMs - elapsed);
}
