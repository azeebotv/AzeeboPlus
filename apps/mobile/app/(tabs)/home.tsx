import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { contentApi } from '../../src/api';
import type { ContentItem } from '../../src/api/content';
import { colors, typography, spacing, radius, universeColors } from '../../src/theme';
import { BrandButton } from '../../src/components/ui';
import { ContentCardSkeleton, ErrorState, EmptyState } from '../../src/components/StateContainers';
import {
  PageTransition,
  ScrollReveal,
  StaggerGrid,
  AnimatedProgress,
} from '../../src/components/motion';

interface ContentSection {
  title: string;
  content: ContentItem[];
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [activeTab, setActiveTab] = useState<'fyp' | 'live' | 'universes' | 'subscriptions'>('fyp');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendingCount, setTrendingCount] = useState(3);
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadSections = useCallback(async () => {
    try {
      setError(null);
      const response = await contentApi.getTrendingContent(trendingCount);
      const trending = response.data || [];
      setSections([
        { title: '🔥 Trending Now', content: trending },
        { title: '✨ For You', content: trending },
      ]);
    } catch {
      setError('Failed to load content');
    }
  }, [trendingCount]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setTrendingCount((prev) => Math.min(prev + 3, 21));
    await loadSections();
    setIsRefreshing(false);
  }, [loadSections]);

  useEffect(() => {
    loadSections().finally(() => setIsLoading(false));
  }, [loadSections]);

  const tabs = [
    { key: 'fyp' as const, label: 'For You', icon: '◉' },
    { key: 'live' as const, label: 'Live', icon: '▶' },
    { key: 'universes' as const, label: 'Universes', icon: '◈' },
    { key: 'subscriptions' as const, label: 'Subscriptions', icon: '♡' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#ffffff' },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <PageTransition>
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              accessibilityLabel={`${tab.label} tab`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
            >
              <Text
                style={[
                  styles.tabIcon,
                  activeTab === tab.key && styles.tabIconActive,
                ]}
              >
                {tab.icon}
              </Text>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </PageTransition>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </View>
        ) : error ? (
          <ErrorState description={error} onRetry={loadSections} />
        ) : sections.length === 0 ? (
          <EmptyState
            icon="◉"
            title="No content yet"
            description="Content will appear here once it's available"
            actionLabel="Refresh"
            onAction={loadSections}
          />
        ) : (
          sections.map((section, sectionIndex) => (
            <ScrollReveal key={section.title} direction="up" delay={sectionIndex * 100}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <BrandButton title="See All" onPress={() => {}} variant="ghost" />
                </View>

                <StaggerGrid staggerDelay={80}>
                  {section.content.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.contentCard}
                      onPress={() => router.push(`/watch/${item.id}`)}
                      activeOpacity={0.8}
                      accessibilityLabel={`${item.title} by ${item.creator.name}`}
                      accessibilityRole="button"
                    >
                      <View style={styles.thumbnailContainer}>
                        <View
                          style={[
                            styles.thumbnail,
                            { backgroundColor: colors.bg.tertiary },
                          ]}
                        >
                          <Text style={styles.playIcon}>▶</Text>
                        </View>
                        {item.duration != null && (
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>
                              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.contentInfo}>
                        <Text style={styles.contentTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.contentCreator}>{item.creator.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </StaggerGrid>
              </View>
            </ScrollReveal>
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: 'rgba(232,66,10,0.15)',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
    color: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  loadingContainer: {
    gap: spacing.lg,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  contentCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  thumbnailContainer: {
    width: 120,
    height: 80,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  contentInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  contentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  contentCreator: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
