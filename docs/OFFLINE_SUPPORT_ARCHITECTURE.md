# Offline Support Architecture

## Overview

This document describes the offline support architecture for the Azeebo+ mobile app, enabling users to access critical features without an internet connection.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   UI Layer  │  │  Hooks/API  │  │ Sync Engine │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          ▼                                 │
│  ┌─────────────────────────────────────────────────┐      │
│  │              Offline Store (SQLite)              │      │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐      │      │
│  │  │  Cache    │ │  Queue    │ │   Meta    │      │      │
│  │  │  Tables   │ │  Tables   │ │  Tables   │      │      │
│  │  └───────────┘ └───────────┘ └───────────┘      │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Sync when online
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Offline Store (SQLite)

```typescript
// packages/mobile/offline-store/src/index.ts
import Database from 'react-native-sqlite-storage';

export interface OfflineStore {
  // Cache operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;

  // Queue operations
  enqueue(action: OfflineAction): Promise<string>;
  dequeue(): Promise<OfflineAction | null>;
  peek(): Promise<OfflineAction | null>;
  getQueueSize(): Promise<number>;

  // Sync metadata
  getLastSyncTime(): Promise<Date | null>;
  setLastSyncTime(date: Date): Promise<void>;
  getPendingChanges(): Promise<PendingChange[]>;
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

export interface PendingChange {
  table: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: Date;
}
```

### 2. Sync Engine

```typescript
// packages/mobile/offline-store/src/sync-engine.ts
export class SyncEngine {
  constructor(
    private store: OfflineStore,
    private apiClient: ApiClient,
    private conflictResolver: ConflictResolver,
  ) {}

  async sync(): Promise<SyncResult> {
    const result: SyncResult = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // 1. Process offline queue
      result.uploaded = await this.processOfflineQueue();

      // 2. Fetch latest changes
      const lastSync = await this.store.getLastSyncTime();
      result.downloaded = await this.downloadChanges(lastSync);

      // 3. Update sync timestamp
      await this.store.setLastSyncTime(new Date());

      return result;
    } catch (error) {
      result.errors.push(error.message);
      throw error;
    }
  }

  private async processOfflineQueue(): Promise<number> {
    let processed = 0;
    let action = await this.store.dequeue();

    while (action) {
      try {
        await this.apiClient.execute(action);
        processed++;
      } catch (error) {
        if (action.retryCount < MAX_RETRY_COUNT) {
          await this.store.enqueue({
            ...action,
            retryCount: action.retryCount + 1,
          });
        } else {
          // Move to failed actions table
          await this.moveToFailedActions(action);
        }
      }
      action = await this.store.dequeue();
    }

    return processed;
  }

  private async downloadChanges(lastSync: Date): Promise<number> {
    const changes = await this.apiClient.getChanges(lastSync);
    let downloaded = 0;

    for (const change of changes) {
      const conflict = await this.checkConflict(change);
      if (conflict) {
        await this.conflictResolver.resolve(conflict);
      } else {
        await this.applyChange(change);
      }
      downloaded++;
    }

    return downloaded;
  }
}
```

### 3. Offline Hooks

```typescript
// packages/mobile/hooks/src/useOfflineContent.ts
import { useCallback, useEffect, useState } from 'react';
import { useOfflineStore } from '@azeebo/offline-store';
import { useNetworkStatus } from './useNetworkStatus';

interface UseOfflineContentOptions<T> {
  key: string;
  fetchFn: () => Promise<T>;
  ttl?: number;
}

export function useOfflineContent<T>({
  key,
  fetchFn,
  ttl = 5 * 60 * 1000, // 5 minutes default
}: UseOfflineContentOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useNetworkStatus();
  const store = useOfflineStore();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Try cache first
        const cached = await store.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);

          // Refresh in background if online
          if (isOnline) {
            refreshInBackground();
          }
        } else if (isOnline) {
          // No cache, fetch from API
          const fresh = await fetchFn();
          if (!cancelled) {
            setData(fresh);
            await store.set(key, fresh, ttl);
          }
        } else {
          // Offline with no cache
          setError(new Error('No cached data available'));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          // Fall back to cache on error
          const cached = await store.get<T>(key);
          if (cached) {
            setData(cached);
          }
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [key, isOnline]);

  async function refreshInBackground() {
    try {
      const fresh = await fetchFn();
      if (!cancelled) {
        setData(fresh);
        await store.set(key, fresh, ttl);
      }
    } catch {
      // Silently fail - we already have cached data
    }
  }

  return { data, loading, error, refetch: loadData };
}
```

### 4. Offline Queue Hook

```typescript
// packages/mobile/hooks/src/useOfflineAction.ts
import { useCallback } from 'react';
import { useOfflineStore } from '@azeebo/offline-store';
import { useNetworkStatus } from './useNetworkStatus';

interface UseOfflineActionOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

export function useOfflineAction<T>(
  actionType: string,
  executeFn: (payload: T) => Promise<unknown>,
  options: UseOfflineActionOptions = {},
) {
  const { isOnline } = useNetworkStatus();
  const store = useOfflineStore();

  const execute = useCallback(async (payload: T) => {
    if (isOnline) {
      try {
        const result = await executeFn(payload);
        options.onSuccess?.(result);
        return result;
      } catch (error) {
        // If API fails, queue for later
        await store.enqueue({
          id: generateId(),
          type: actionType,
          payload,
          createdAt: new Date(),
          retryCount: 0,
          status: 'pending',
        });
        options.onError?.(error as Error);
        return null;
      }
    } else {
      // Queue for later
      await store.enqueue({
        id: generateId(),
        type: actionType,
        payload,
        createdAt: new Date(),
        retryCount: 0,
        status: 'pending',
      });
      return null;
    }
  }, [isOnline, actionType, executeFn, store, options]);

  return { execute };
}
```

### 5. Network Status Hook

```typescript
// packages/mobile/hooks/src/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setStatus);
    return () => unsubscribe();
  }, []);

  return {
    isOnline: status?.isConnected ?? false,
    isWifi: status?.type === 'wifi',
    isCellular: status?.type === 'cellular',
    details: status?.details,
  };
}
```

### 6. Offline Indicator Component

```typescript
// packages/mobile/ui/src/components/OfflineBanner.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@azeebo/hooks';
import { usePendingActionsCount } from '@azeebo/hooks';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const pendingCount = usePendingActionsCount();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View style={[styles.banner, !isOnline && styles.offline]}>
      {!isOnline ? (
        <Text style={styles.text}>You're offline</Text>
      ) : (
        <Text style={styles.text}>
          Syncing {pendingCount} pending {pendingCount === 1 ? 'action' : 'actions'}...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#4CAF50',
    padding: 8,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: '#FF9800',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
```

## Sync Strategies

### 1. Pull-Based Sync

```typescript
async function pullSync(lastSyncTime: Date): Promise<void> {
  const changes = await api.getChangesSince(lastSyncTime);

  for (const change of changes) {
    await db.transaction(async (tx) => {
      switch (change.operation) {
        case 'create':
        case 'update':
          await tx.upsert(change.table, change.data);
          break;
        case 'delete':
          await tx.delete(change.table, change.id);
          break;
      }
    });
  }
}
```

### 2. Push-Based Sync

```typescript
async function pushSync(): Promise<void> {
  const pendingActions = await store.getPendingActions();

  for (const action of pendingActions) {
    try {
      await api.execute(action);
      await store.removePendingAction(action.id);
    } catch (error) {
      if (error.status === 409) {
        // Conflict - needs resolution
        await handleConflict(action, error.conflict);
      } else {
        // Retry later
        throw error;
      }
    }
  }
}
```

### 3. Bidirectional Sync

```typescript
async function bidirectionalSync(): Promise<SyncResult> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    conflicts: 0,
  };

  // Push local changes first
  result.pushed = await pushSync();

  // Then pull remote changes
  result.pulled = await pullSync(lastSyncTime);

  // Resolve conflicts
  const conflicts = await detectConflicts();
  for (const conflict of conflicts) {
    await resolveConflict(conflict);
    result.conflicts++;
  }

  return result;
}
```

## Conflict Resolution

### Conflict Types

1. **Update-Update**: Both local and remote versions modified
2. **Delete-Update**: Local deleted, remote updated
3. **Update-Delete**: Local updated, remote deleted

### Resolution Strategies

```typescript
type ConflictStrategy = 'local_wins' | 'remote_wins' | 'merge' | 'manual';

interface ConflictResolver {
  resolve(
    localChange: Change,
    remoteChange: Change,
    strategy: ConflictStrategy,
  ): Promise<ResolvedChange>;
}

// Example: Last-write-wins
async function resolveWithLastWriteWins(
  local: Change,
  remote: Change,
): Promise<Change> {
  return local.timestamp > remote.timestamp ? local : remote;
}

// Example: Field-level merge
async function resolveWithFieldMerge(
  local: Change,
  remote: Change,
): Promise<Change> {
  const mergedData = { ...remote.data };
  for (const [key, localValue] of Object.entries(local.data)) {
    if (localValue.timestamp > (mergedData[key]?.timestamp || 0)) {
      mergedData[key] = localValue;
    }
  }
  return { ...local, data: mergedData };
}
```

## Database Schema

```sql
-- Cache table
CREATE TABLE offline_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
);

-- Action queue
CREATE TABLE action_queue (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
);

-- Sync metadata
CREATE TABLE sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
);

-- Pending changes (for bidirectional sync)
CREATE TABLE pending_changes (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
);
```

## Critical Features for Offline Support

| Feature | Priority | Description |
|---------|----------|-------------|
| View cached content | Critical | Browse previously loaded content |
| Queue actions | Critical | Save user actions when offline |
| Sync when online | Critical | Process queue when connection restored |
| Show offline indicator | High | Inform user about offline status |
| Conflict resolution | High | Handle sync conflicts gracefully |
| Cache management | Medium | Limit cache size, auto-cleanup |

## Implementation Checklist

- [ ] SQLite database setup
- [ ] Offline store implementation
- [ ] Sync engine implementation
- [ ] Network status hook
- [ ] Offline content hook
- [ ] Offline action hook
- [ ] Offline banner component
- [ ] Conflict resolution strategy
- [ ] Cache size management
- [ ] Background sync service