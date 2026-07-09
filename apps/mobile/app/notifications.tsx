import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../src/hooks/useNotificationQuery';
import { LoadingState, ErrorState } from '../src/components/StateContainers';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const { data, isLoading, error, refetch } = useNotifications();
  const markAsReadMutation = useMarkNotificationRead();
  const markAllAsReadMutation = useMarkAllNotificationsRead();

  const notificationsList = data?.items ?? [];

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <ScrollView
          style={[
            styles.container,
            { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
          ]}
        >
          <LoadingState text="Loading notifications..." />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <ScrollView
          style={[
            styles.container,
            { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
          ]}
        >
          <ErrorState description={error instanceof Error ? error.message : 'Failed to load'} onRetry={() => refetch()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const markAsRead = async (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
      ]}
    >
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.notificationList}>
          {notificationsList.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
              <Text style={[{ fontSize: 16, color: '#888' }]}>No notifications yet</Text>
            </View>
          ) : (
            notificationsList.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, notification.read && { opacity: 0.6 }]}
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationContent}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                    ]}
                  >
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage}>{notification.body || ''}</Text>
                  <View style={styles.notificationFooter}>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text
            style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Notification Settings
          </Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                ]}
              >
                Push Notifications
              </Text>
              <Text style={styles.settingDescription}>Receive important updates</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#E8420A' }}
              thumbColor={pushEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                ]}
              >
                Email Notifications
              </Text>
              <Text style={styles.settingDescription}>
                Receive newsletters and updates via email
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#E8420A' }}
              thumbColor={emailEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8420A',
    borderRadius: 8,
  },
  markAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationAction: {
    fontSize: 12,
    color: '#E8420A',
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  settingsSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
  },
});
