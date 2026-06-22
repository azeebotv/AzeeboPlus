import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api';
import { logger } from '../../src/utils/logger';

interface Device {
  id: string;
  name: string;
  type: string;
  os: string;
  browser: string;
  lastActive: string;
  location: string;
  isCurrent: boolean;
  ip: string;
}

export default function DeviceManagementScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await authApi.getDevices();
      if (response.success && response.data) {
        setDevices(response.data);
      }
    } catch (error) {
      logger.error('Failed to load devices', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDevices();
    setIsRefreshing(false);
  };

  const revokeDevice = (deviceId: string) => {
    Alert.alert('Revoke Device', 'Are you sure you want to revoke access for this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.revokeDevice(deviceId);
            setDevices(devices.filter((d) => d.id !== deviceId));
          } catch (error) {
            Alert.alert('Error', 'Failed to revoke device');
          }
        },
      },
    ]);
  };

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'mobile':
        return '📱';
      case 'desktop':
        return '💻';
      case 'tablet':
        return '📟';
      default:
        return '🖥️';
    }
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <View style={[styles.deviceCard, item.isCurrent && styles.deviceCardCurrent]}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceIcon}>{getDeviceIcon(item.type)}</Text>
          <View style={styles.deviceDetails}>
            <View style={styles.deviceNameRow}>
              <Text style={styles.deviceName}>{item.name}</Text>
              {item.isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>
            <Text style={styles.deviceMeta}>
              {item.os} • {item.browser}
            </Text>
            <Text style={styles.deviceMeta}>
              Last active: {new Date(item.lastActive).toLocaleString()}
            </Text>
            <Text style={styles.deviceMeta}>
              Location: {item.location} • IP: {item.ip}
            </Text>
          </View>
        </View>
        {!item.isCurrent && (
          <TouchableOpacity style={styles.revokeButton} onPress={() => revokeDevice(item.id)}>
            <Text style={styles.revokeButtonText}>Revoke</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Management</Text>
        <Text style={styles.subtitle}>Manage your active sessions and devices</Text>
      </View>

      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          🔒 For your security, review all active devices regularly. Revoke access for any device
          you don't recognize.
        </Text>
      </View>

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🖥️</Text>
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubtext}>Your active sessions will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  warningBanner: {
    backgroundColor: '#F59E0B1A',
    borderWidth: 1,
    borderColor: '#F59E0B33',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  deviceCardCurrent: {
    borderColor: '#8B5CF6',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deviceInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  deviceIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  currentBadge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  deviceMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  revokeButton: {
    backgroundColor: '#EF444420',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  revokeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
