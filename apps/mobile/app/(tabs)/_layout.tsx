import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, typography, spacing, radius, shadows, spring } from '../../src/theme';
import { useWallet } from '../../src/contexts/WalletContext';
import { useNotification } from '../../src/contexts/NotificationContext';
import { useAuth } from '../../src/contexts/AuthContext';

interface TabIconProps {
  name: string;
  focused: boolean;
}

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home: { active: '◉', inactive: '○' },
  watch: { active: '▶', inactive: '▷' },
  rewards: { active: '★', inactive: '☆' },
  profile: { active: '●', inactive: '○' },
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function TabIcon({ name, focused }: TabIconProps) {
  const scale = useSharedValue(focused ? 1.15 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, spring.snappy);
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconSet = TAB_ICONS[name] || TAB_ICONS.home;

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {focused ? iconSet.active : iconSet.inactive}
      </Text>
    </Animated.View>
  );
}

function CreateButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, spring.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, spring.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      style={[styles.createButton, animatedStyle]}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel="Create content"
      accessibilityRole="button"
      testID="tab-create"
    >
      <View style={styles.createButtonInner}>
        <Text style={styles.createIcon}>+</Text>
      </View>
    </AnimatedTouchable>
  );
}

function HeaderUtilities({ router }: { router: ReturnType<typeof useRouter> }) {
  const { wallet } = useWallet();
  const { unreadCount } = useNotification();
  const { user } = useAuth();
  const walletBalance = wallet?.balance?.toLocaleString() ?? '0';
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Check if there are any live shows
    const checkLive = async () => {
      try {
        const response = await fetch('/api/v1/reality/shows/live');
        const data = await response.json();
        setIsLive(data?.shows?.length > 0);
      } catch {
        setIsLive(false);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, []);

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={[styles.logo, { color: colors.text.primary }]}>
          AZEEBO<Text style={styles.logoPlus}>+</Text>
        </Text>
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/search')}
          accessibilityLabel="Search"
          accessibilityRole="button"
          testID="header-search-button"
        >
          <Text style={styles.headerButtonText}>⌕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/wallet')}
          accessibilityLabel={`Wallet balance: ${walletBalance} tokens`}
          accessibilityRole="button"
          testID="header-wallet-button"
        >
          <Text style={styles.headerButtonText}>◈</Text>
          <View style={styles.walletBadge}>
            <Text style={styles.walletText}>{walletBalance}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/notifications')}
          accessibilityLabel={`${unreadCount} notifications`}
          accessibilityRole="button"
          testID="header-notifications-button"
        >
          <Text style={styles.headerButtonText}>♡</Text>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityLabel="Profile"
          accessibilityRole="button"
          testID="header-profile-button"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <HeaderUtilities router={router} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg.primary,
            borderTopColor: colors.border.default,
            borderTopWidth: 1,
            height: 84,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold as unknown as string,
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon name="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="watch"
          options={{
            title: 'Watch',
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon name="watch" focused={focused} />
            ),
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
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon name="rewards" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon name="profile" focused={focused} />
            ),
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoPlus: {
    color: colors.primary[500],
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.red,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success[500],
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  walletBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  walletText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  avatarButton: {
    marginLeft: spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
    color: colors.primary[500],
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  createButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.red,
  },
  createIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
