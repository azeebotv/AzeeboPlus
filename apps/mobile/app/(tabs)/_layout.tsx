import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Feather from '@expo/vector-icons/Feather';
import { colors, typography, spacing, radius, shadows, spring } from '../../src/theme';
import { useWallet } from '../../src/contexts/WalletContext';
import { useNotification } from '../../src/contexts/NotificationContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/api/client';
import { logger } from '../../src/utils/logger';

interface TabIconProps {
  name: 'home' | 'watch' | 'rewards' | 'tips' | 'profile';
  focused: boolean;
}

const TAB_FEATHER_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  home: 'home',
  watch: 'play-circle',
  rewards: 'award',
  tips: 'heart',
  profile: 'user',
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

  const iconName = TAB_FEATHER_ICONS[name] || 'circle';

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Feather
        name={iconName}
        size={22}
        color={focused ? colors.primary[500] : colors.text.tertiary}
      />
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
        <Feather name="plus" size={26} color="#FFFFFF" />
      </View>
    </AnimatedTouchable>
  );
}

function HeaderUtilities({
  router,
  insets,
}: {
  router: ReturnType<typeof useRouter>;
  insets: { top: number };
}) {
  const { wallet } = useWallet();
  const { unreadCount } = useNotification();
  const { user } = useAuth();
  const walletBalance = wallet?.balance?.toLocaleString() ?? '0';
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Check if there are any live shows. Uses the configured API base URL —
    // relative URLs never resolve in React Native fetch.
    const checkLive = async () => {
      try {
        const response = await fetch(`${apiClient.getBaseURL()}/api/v1/reality/shows/live`);
        if (!response.ok) {
          setIsLive(false);
          return;
        }
        const data = (await response.json()) as { shows?: unknown[] } | null;
        setIsLive(Array.isArray(data?.shows) && data.shows.length > 0);
      } catch (error) {
        logger.warn('Live-shows check failed', undefined, error);
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
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerLeft}>
        <Image
          source={require('../../assets/logo-white.png')}
          style={{ width: 108, height: 26 }}
          resizeMode="contain"
          accessibilityLabel="Azeebo+ Logo"
        />
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
          <Feather name="search" size={18} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/wallet')}
          accessibilityLabel={`Wallet balance: ${walletBalance} tokens`}
          accessibilityRole="button"
          testID="header-wallet-button"
        >
          <Feather name="credit-card" size={18} color={colors.text.primary} />
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
          <Feather name="bell" size={18} color={colors.text.primary} />
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
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <HeaderUtilities router={router} insets={insets} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg.primary,
            borderTopColor: 'rgba(255,255,255,0.08)',
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
          name="tipping"
          options={{
            title: 'Tips',
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon name="tips" focused={focused} />
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
    // Top padding is injected at render time from useSafeAreaInsets() —
    // a fixed 50px collides with notches / Dynamic Island on some devices.
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
