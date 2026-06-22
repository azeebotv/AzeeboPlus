import { Tabs, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

// Type declaration for expo-router focused parameter
interface TabIconProps {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  focused: any;
}

function TabIcon({ name, focused }: TabIconProps) {
  const icons: Record<string, string> = {
    home: '🏠',
    watch: '📺',
    create: '🎬',
    rewards: '🎁',
    profile: '👤',
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icons[name]}</Text>
    </View>
  );
}

function CreateButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.createButton} activeOpacity={0.7}>
      <View style={styles.createButtonInner}>
        <Text style={styles.createIcon}>+</Text>
      </View>
    </TouchableOpacity>
  );
}

function HeaderUtilities({
  router,
  colorScheme,
}: {
  router: ReturnType<typeof useRouter>;
  colorScheme: ReturnType<typeof useColorScheme>;
}) {
  const [notificationCount, setNotificationCount] = useState(3);
  const [walletBalance, setWalletBalance] = useState('2,500');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(true); // Mock: deterministic live status
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={[styles.logo, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          AZEEBO+
        </Text>
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/search')}>
          <Text style={styles.headerIcon}>🔍</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/wallet')}>
          <Text style={styles.headerIcon}>💰</Text>
          <View style={styles.walletBadge}>
            <Text style={styles.walletText}>{walletBalance}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/notifications')}>
          <Text style={styles.headerIcon}>🔔</Text>
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' },
      ]}
    >
      <HeaderUtilities router={router} colorScheme={colorScheme} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
            borderTopColor: colorScheme === 'dark' ? '#1a1a1a' : '#e5e5e5',
            borderTopWidth: 1,
            height: 84,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#888888',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name="home" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="watch"
          options={{
            title: 'Watch',
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name="watch" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: '',
            tabBarButton: () => <CreateButton onPress={() => router.push('/(tabs)/create')} />,
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name="rewards" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name="profile" focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  liveText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 16,
  },
  walletBadge: {
    position: 'absolute',
    bottom: -2,
    left: 50,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  walletText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarButton: {
    marginLeft: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  createButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  createIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
});
