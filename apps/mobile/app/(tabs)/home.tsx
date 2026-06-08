import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, universeColors } from '@azeebo/design-tokens';
import { contentApi, universeApi, type ContentItem, type Universe } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';

// Define a local type for the combined "All" universe
type HomeUniverse = Universe | { id: 'all'; name: string; icon: string };

export default function HomeScreen() {
  const router = useRouter();
  const [selectedUniverse, setSelectedUniverse] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContentItem[]>([]);
  const [forYouContent, setForYouContent] = useState<ContentItem[]>([]);
  const [universes, setUniverses] = useState<HomeUniverse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchData = async () => {
    setHasError(false);
    try {
      const [trendingRes, featuredRes, universesRes] = await Promise.all([
        contentApi.getTrendingContent(5),
        contentApi.getFeaturedContent(6),
        universeApi.getUniverses(1, 100)
      ]);

      if (trendingRes.success && trendingRes.data) {
        setTrendingContent(trendingRes.data);
      } else {
        setTrendingContent([]);
      }
      
      if (featuredRes.success && featuredRes.data) {
        setForYouContent(featuredRes.data);
      } else {
        setForYouContent([]);
      }

      if (universesRes.success && universesRes.data) {
        setUniverses([
          { id: 'all', name: 'All', icon: '🎬' },
          ...universesRes.data.items
        ]);
      } else {
        setUniverses([{ id: 'all', name: 'All', icon: '🎬' }]);
      }
    } catch (e) {
      logger.error('Error fetching home data', e);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getUniverseColor = (id: string) => {
    if (id === 'all') return colors.primary;
    return universeColors[id as keyof typeof universeColors]?.primary || colors.primary;
  };

  const renderUniverseSelector = () => (
    <View accessibilityRole="tablist" accessibilityLabel="Content categories">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.universeContainer}
      >
        {universes.map((universe) => {
          const isActive = selectedUniverse === universe.id;
          const isAllUniverse = universe.id === 'all';
          return (
            <TouchableOpacity
              key={universe.id}
              style={[
                styles.universeButton,
                isActive && {
                  backgroundColor: getUniverseColor(universe.id),
                },
              ]}
              onPress={() => setSelectedUniverse(universe.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${universe.name} content category`}
              accessibilityHint={`Filter content by ${universe.name}`}
            >
              <Text style={styles.universeEmoji}>
                {'icon' in universe ? universe.icon : '🎬'}
              </Text>
              <Text
                style={[
                  styles.universeName,
                  isActive && styles.universeNameActive,
                ]}
              >
                {universe.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderContinueWatching = () => {
    if (continueWatching.length === 0) {
      return (
        <View style={styles.section} accessibilityRole="region" accessibilityLabel="Continue Watching section">
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No content to continue watching</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.section} accessibilityRole="region" accessibilityLabel="Continue Watching section">
        <Text style={styles.sectionTitle}>Continue Watching</Text>
        <FlatList
          horizontal
          data={continueWatching}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.continueCard}
              onPress={() => router.push(`/watch/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Continue watching: ${item.title} from ${item.universe?.name || 'unknown universe'}`}
              accessibilityHint="Tap to resume watching this content"
            >
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
              ) : (
                <View style={styles.thumbnail} />
              )}
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.universe?.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderTrending = () => {
    if (trendingContent.length === 0) {
      return (
        <View style={styles.section} accessibilityRole="region" accessibilityLabel="Trending Now section">
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No trending content available</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.section} accessibilityRole="region" accessibilityLabel="Trending Now section">
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <FlatList
          horizontal
          data={trendingContent}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.trendingCard}
              onPress={() => router.push(`/watch/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Trending: ${item.title} from ${item.universe?.name || 'unknown universe'}`}
              accessibilityHint="Tap to watch this trending content"
            >
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.trendingThumbnail} />
              ) : (
                <View style={styles.trendingThumbnail} />
              )}
              <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.trendingViews}>{item.universe?.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderForYou = () => {
    if (forYouContent.length === 0) {
      return (
        <View style={styles.section} accessibilityRole="region" accessibilityLabel="For You section">
          <Text style={styles.sectionTitle}>For You</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <Text style={styles.emptyHint}>Try watching some content to get personalized recommendations</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.section} accessibilityRole="region" accessibilityLabel="For You section">
        <Text style={styles.sectionTitle}>For You</Text>
        <View style={styles.foryouGrid}>
          {forYouContent.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.foryouCard}
              onPress={() => router.push(`/watch/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Recommended: ${item.title} from ${item.universe?.name || 'unknown universe'}`}
              accessibilityHint="Tap to watch this recommended content"
            >
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.foryouThumbnail} />
              ) : (
                <View style={styles.foryouThumbnail} />
              )}
              <Text style={styles.foryouTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.foryouMeta}>{item.universe?.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading home content..." />
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          title="Failed to load home content"
          description="Please check your internet connection and try again"
          onRetry={fetchData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon} />
            <Text style={styles.logo}>AZEEBO+</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>💰</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {renderUniverseSelector()}
        {renderContinueWatching()}
        {renderTrending()}
        {renderForYou()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  universeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  universeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.bg.secondary,
    marginRight: 10,
  },
  universeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  universeName: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  universeNameActive: {
    color: colors.text.inverse,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  continueCard: {
    width: 170,
    marginRight: 14,
  },
  thumbnail: {
    width: 170,
    height: 96,
    borderRadius: 14,
    backgroundColor: colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.bg.tertiary,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  trendingCard: {
    width: 150,
    marginRight: 14,
  },
  trendingThumbnail: {
    width: 150,
    height: 210,
    borderRadius: 14,
    backgroundColor: colors.bg.secondary,
    marginBottom: 10,
  },
  trendingTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingViews: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  foryouGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  foryouCard: {
    width: '47%',
    marginBottom: 18,
  },
  foryouThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    backgroundColor: colors.bg.secondary,
    marginBottom: 10,
  },
  foryouTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  foryouMeta: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  bottomPadding: {
    height: 40,
  },
  emptySection: {
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    marginHorizontal: 16,
    borderRadius: 14,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyHint: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 8,
  },
});
