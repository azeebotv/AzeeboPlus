import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter, usePathname, type Href } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { useWallet } from '@azeebo/react-data/contexts/WalletContext';
import { FocusableCard } from './Focusable';
import { colors, tvTypography, tvSpacing, tvRadius } from '../theme';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: Href;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'search', label: 'Search', icon: '🔍', route: '/search' as Href },
  { id: 'home', label: 'Home', icon: '🏠', route: '/' as Href },
  { id: 'universes', label: 'Universes', icon: '🌌', route: '/browse' as Href },
  { id: 'reality', label: 'Reality & Live', icon: '🔴', route: '/reality' as Href },
  { id: 'movies', label: 'Cinemaxis', icon: '🎬', route: '/movies' as Href },
  { id: 'comedy', label: 'Comedy', icon: '😂', route: '/comedy' as Href },
  { id: 'sports', label: 'Sports Pulse', icon: '⚽', route: '/sports' as Href },
  { id: 'games', label: 'Arcade & Trivia', icon: '🎮', route: '/games' as Href },
  { id: 'creator', label: 'Creator Studio', icon: '🎨', route: '/creator' as Href },
  { id: 'bundles', label: 'Bundle Passes', icon: '🎟️', route: '/bundles' as Href },
  { id: 'library', label: 'My Library', icon: '📚', route: '/library' as Href },
  { id: 'wallet', label: 'Wallet & Coins', icon: '🪙', route: '/wallet/fund' as Href },
  { id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' as Href },
];

const COLLAPSED_WIDTH = 76;
const EXPANDED_WIDTH = 260;

interface TVNavRailProps {
  style?: StyleProp<ViewStyle>;
  hasInitialFocus?: boolean;
}

export function TVNavRail({ style, hasInitialFocus = false }: TVNavRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { wallet } = useWallet();
  const coinBalance = wallet?.balance ?? 250000;

  const [isExpanded, setIsExpanded] = useState(false);
  const widthAnim = useRef(new Animated.Value(COLLAPSED_WIDTH)).current;

  const handleRailFocus = useCallback(() => {
    setIsExpanded(true);
    Animated.timing(widthAnim, {
      toValue: EXPANDED_WIDTH,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [widthAnim]);

  const handleRailBlur = useCallback(() => {
    setIsExpanded(false);
    Animated.timing(widthAnim, {
      toValue: COLLAPSED_WIDTH,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [widthAnim]);

  const isCurrentRoute = (route: string) => {
    if (route === '/' && (pathname === '/' || pathname === '/index')) return true;
    if (route !== '/' && pathname.startsWith(route)) return true;
    return false;
  };

  return (
    <Animated.View
      style={[
        styles.railContainer,
        { width: widthAnim },
        isExpanded && styles.railContainerExpanded,
        style,
      ]}
    >
      {/* ── Brand Header ────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>A+</Text>
        </View>
        {isExpanded && (
          <View style={styles.brandTitleContainer}>
            <Text style={styles.brandTitle} numberOfLines={1}>AZEEBO+</Text>
            <Text style={styles.brandSubtitle}>TV EDITION</Text>
          </View>
        )}
      </View>

      {/* ── Navigation Items ────────────────────────────────── */}
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
      >
        {NAV_ITEMS.map((item, index) => {
          const active = isCurrentRoute(item.route as string);
          return (
            <FocusableCard
              key={item.id}
              style={[
                styles.navItem,
                active && styles.navItemActive,
                isExpanded ? styles.navItemExpanded : styles.navItemCollapsed,
              ]}
              hasTVPreferredFocus={hasInitialFocus && index === 1}
              onPress={() => router.push(item.route)}
            >
              <View
                style={styles.navRow}
                onFocus={handleRailFocus}
                onBlur={handleRailBlur}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                {isExpanded && (
                  <Text
                    style={[
                      styles.navLabel,
                      active && styles.navLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                )}
                {active && <View style={styles.activeIndicator} />}
              </View>
            </FocusableCard>
          );
        })}
      </ScrollView>

      {/* ── User / Coins Footer ─────────────────────────────── */}
      <View style={styles.footer}>
        <FocusableCard
          style={[styles.userCard, isExpanded && styles.userCardExpanded]}
          onPress={() => router.push(isAuthenticated ? ('/profile/account' as Href) : ('/signin' as Href))}
        >
          <View
            style={styles.userRow}
            onFocus={handleRailFocus}
            onBlur={handleRailBlur}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>
                {user?.name ? user.name[0].toUpperCase() : '👤'}
              </Text>
            </View>
            {isExpanded && (
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Sign In'}
                </Text>
                <View style={styles.coinsPill}>
                  <Text style={styles.coinsText}>
                    🪙 {coinBalance.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </FocusableCard>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  railContainer: {
    height: '100%',
    backgroundColor: 'rgba(11, 9, 14, 0.95)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: tvSpacing.lg,
    paddingHorizontal: tvSpacing.xs,
    justifyContent: 'space-between',
    zIndex: 100,
  },
  railContainerExpanded: {
    backgroundColor: 'rgba(15, 12, 20, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    borderRightColor: 'rgba(255, 94, 30, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tvSpacing.xs,
    marginBottom: tvSpacing.md,
    gap: tvSpacing.sm,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTitleContainer: {
    flex: 1,
  },
  brandTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.base,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: colors.primary[500],
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    gap: 6,
    paddingVertical: tvSpacing.xs,
  },
  navItem: {
    borderRadius: tvRadius.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemCollapsed: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemExpanded: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 94, 30, 0.15)',
    borderColor: colors.primary[500],
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  navIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  navLabel: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.sm,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    left: -12,
    top: 4,
    bottom: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: tvSpacing.sm,
  },
  userCard: {
    borderRadius: tvRadius.md,
    backgroundColor: 'transparent',
    padding: 6,
  },
  userCardExpanded: {
    paddingHorizontal: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  userInitial: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  coinsPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  coinsText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
  },
});
