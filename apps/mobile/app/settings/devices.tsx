import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi, type Device } from '@azeebo/react-data';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

export default function DeviceManagementScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDevices();
    }
  }, [isAuthenticated]);

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
            {item.os || item.browser ? (
              <Text style={styles.deviceMeta}>
                {item.os ?? 'Unknown OS'} • {item.browser ?? 'Unknown browser'}
              </Text>
            ) : null}
            <Text style={styles.deviceMeta}>
              Last active: {new Date(item.lastActive).toLocaleString()}
            </Text>
            {(item.location || item.ip) && (
              <Text style={styles.deviceMeta}>
                {item.location ? `Location: ${item.location}` : ''}
                {item.ip ? ` • IP: ${item.ip}` : ''}
              </Text>
            )}
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Device Management</Text>
          <Text style={styles.subtitle}>Manage your active sessions and devices</Text>
        </View>
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
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[brand.flame]}
            tintColor={brand.flame}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🖥️</Text>
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubtext}>Your active sessions will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.accent.silver,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 60,
    gap: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.accent.silver,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.accent.silver,
  },
  warningBanner: {
    backgroundColor: colors.warning[500] + '15',
    borderWidth: 1,
    borderColor: colors.warning[500] + '33',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning[500],
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    backgroundColor: colors.bg.glass,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  deviceCardCurrent: {
    borderColor: colors.primary[500],
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
    color: colors.text.primary,
    marginRight: 8,
  },
  currentBadge: {
    backgroundColor: colors.primary[500] + '12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary[500],
  },
  deviceMeta: {
    fontSize: 12,
    color: colors.accent.silver,
    marginBottom: 2,
  },
  revokeButton: {
    backgroundColor: colors.error[500] + '12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  revokeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error[500],
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
    color: colors.accent.silver,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});
