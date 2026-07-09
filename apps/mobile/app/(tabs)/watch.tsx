import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { contentApi } from '../../src/api';
import type { ContentItem } from '../../src/api/content';
import { colors, typography, spacing, radius } from '../../src/theme';
import { ContentCardSkeleton, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { ScrollReveal, PageTransition } from '../../src/components/motion';

export default function WatchScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setError(null);
      const response = await contentApi.getTrendingContent(20);
      setContent(response.data || []);
    } catch {
      setError('Failed to load content');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadContent();
    setIsRefreshing(false);
  }, [loadContent]);

  useEffect(() => {
    loadContent().finally(() => setIsLoading(false));
  }, [loadContent]);

  const renderItem = ({ item, index }: { item: ContentItem; index: number }) => (
    <ScrollReveal direction="up" delay={index * 60}>
      <TouchableOpacity
        style={styles.contentCard}
        onPress={() => router.push(`/watch/${item.id}`)}
        activeOpacity={0.8}
        accessibilityLabel={`${item.title} by ${item.creator.name}`}
        accessibilityRole="button"
      >
        <View style={styles.thumbnailContainer}>
          <View style={[styles.thumbnail, { backgroundColor: colors.bg.tertiary }]}>
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
    </ScrollReveal>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#ffffff' },
        ]}
      >
        <FlatList
          data={[1, 2, 3]}
          renderItem={() => <ContentCardSkeleton />}
          keyExtractor={(item) => String(item)}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#ffffff' },
        ]}
      >
        <ErrorState description={error} onRetry={loadContent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#ffffff' },
      ]}
    >
      <PageTransition>
        <FlatList
          data={content}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="▶"
              title="No content to watch"
              description="Check back later for new videos"
              actionLabel="Refresh"
              onAction={loadContent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </PageTransition>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  contentCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.xl,
    overflow: 'hidden',
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
