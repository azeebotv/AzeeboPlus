import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '@azeebo/react-data/api/client';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { analytics } from '../../src/utils/analytics';
import { radius, colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface LiveShow {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  viewers: string;
  isLive: boolean;
}

interface Contestant {
  id: string;
  name: string;
  votes: number;
  image: string;
}

interface FeaturedItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
}

export default function RealityUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const showsQuery = useQuery({
    queryKey: ['reality', 'shows'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<LiveShow>>('/v1/reality/shows');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const contestantsQuery = useQuery({
    queryKey: ['reality', 'contestants'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<Contestant>>('/v1/reality/contestants');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const featuredQuery = useQuery({
    queryKey: ['reality', 'featured'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<FeaturedItem>>('/v1/reality/featured');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = showsQuery.isLoading || contestantsQuery.isLoading || featuredQuery.isLoading;
  const error =
    showsQuery.error?.message || contestantsQuery.error?.message || featuredQuery.error?.message;

  const liveShows = showsQuery.data ?? [];
  const contestants = contestantsQuery.data ?? [];
  const featuredContent = featuredQuery.data ?? [];

  useEffect(() => {
    if (liveShows.length > 0 && liveShows[0].id) {
      analytics.realityShowViewed(liveShows[0].id);
    }
  }, [liveShows]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading reality shows..." />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState
          description={error}
          onRetry={() => {
            showsQuery.refetch();
            contestantsQuery.refetch();
            featuredQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }
  if (!liveShows.length && !contestants.length && !featuredContent.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="🎭"
          title="No shows available"
          description="Check back later for reality shows"
        />
      </SafeAreaView>
    );
  }

  const renderContestantCard = ({ item, index }: { item: Contestant; index: number }) => (
    <TouchableOpacity
      style={[styles.contestantCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      onPress={() => router.push('/vote')}
      accessibilityLabel={`Vote for ${item.name}`}
    >
      <View
        style={[styles.contestantRank, { backgroundColor: index < 3 ? brand.flame : '#4a4a4a' }]}
      >
        <Text style={styles.contestantRankText}>#{index + 1}</Text>
      </View>
      <View style={styles.contestantImagePlaceholder}>
        <Text style={styles.contestantInitial}>{item.name[0]}</Text>
      </View>
      <Text style={[styles.contestantName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
      <Text style={styles.contestantVotes}>{(item.votes / 1000).toFixed(0)}K votes</Text>
    </TouchableOpacity>
  );

  const featuredShow = liveShows[0];
  const showName = featuredShow?.title || 'Reality Show';
  const showSubtitle = featuredShow?.subtitle || '';
  const viewerText = featuredShow?.viewers ? `${featuredShow.viewers} watching` : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <ScrollView style={[{ flex: 1 }, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top, backgroundColor: isDark ? '#1a1a1a' : '#ffffff' },
          ]}
        >
          <View style={styles.headerTop}>
            <Text style={styles.universeLabel}>🎭 Reality</Text>
            <TouchableOpacity style={styles.notificationBadge} accessibilityLabel="Notifications">
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Reality Universe
          </Text>
        </View>

        <TouchableOpacity
          style={styles.liveShowCard}
          onPress={() => router.push('/reality/show')}
          accessibilityLabel={`Watch ${showName} live`}
        >
          <View style={styles.liveShowImagePlaceholder}>
            <Text style={styles.playIcon}>▶️</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            {viewerText ? (
              <View style={styles.viewerCount}>
                <Text style={styles.viewerIcon}>👁️</Text>
                <Text style={styles.viewerText}>{viewerText}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.liveShowInfo}>
            <Text style={[styles.liveShowTitle, { color: isDark ? '#fff' : '#000' }]}>
              {showName}
            </Text>
            {showSubtitle ? <Text style={styles.liveShowSubtitle}>{showSubtitle}</Text> : null}
            <TouchableOpacity style={styles.watchNowButton}>
              <Text style={styles.watchNowText}>Watch Live</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.voteCTA}>
          <View style={styles.voteCTAInfo}>
            <Text style={styles.voteCTAIcon}>🗳️</Text>
            <View>
              <Text style={[styles.voteCTATitle, { color: isDark ? '#fff' : '#000' }]}>
                Vote for Your Favorite
              </Text>
              <Text style={styles.voteCTASubtitle}>Support your contestant</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.voteButton} onPress={() => router.push('/vote')}>
            <Text style={styles.voteButtonText}>Vote Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Leaderboard
            </Text>
            <TouchableOpacity onPress={() => router.push('/vote')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={contestants}
            renderItem={renderContestantCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contestantsList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Featured Highlights
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsList}
          >
            {featuredContent.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.highlightCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              >
                <View style={styles.highlightThumbnail}>
                  <Text style={styles.playSmallIcon}>▶</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                  </View>
                </View>
                <Text style={[styles.highlightTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Past Seasons
            </Text>
          </View>
          <View style={styles.pastSeasonsList}>
            {['Season 8', 'Season 7', 'Season 6', 'Season 5'].map((season, index) => (
              <TouchableOpacity
                key={season}
                style={[styles.seasonCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              >
                <View style={styles.seasonImagePlaceholder}>
                  <Text style={styles.seasonEmoji}>{['🏆', '🥈', '🥉', '🎖️'][index]}</Text>
                </View>
                <Text style={[styles.seasonTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {showName} {season}
                </Text>
                <Text style={styles.seasonSubtitle}>Highlights & Clips</Text>
              </TouchableOpacity>
            ))}
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
    padding: 16,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  universeLabel: {
    fontSize: 14,
    color: colors.error[500],
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'relative',
  },
  bellIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  liveShowCard: {
    margin: 16,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  liveShowImagePlaceholder: {
    height: 200,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playIcon: {
    fontSize: 48,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewerCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  viewerIcon: {
    fontSize: 12,
  },
  viewerText: {
    color: '#fff',
    fontSize: 12,
  },
  liveShowInfo: {
    padding: 16,
  },
  liveShowTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  liveShowSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  watchNowButton: {
    backgroundColor: colors.error[500],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  watchNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  voteCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.flame,
  },
  voteCTAInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voteCTAIcon: {
    fontSize: 32,
  },
  voteCTATitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  voteCTASubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  voteButton: {
    backgroundColor: brand.flame,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: brand.flame,
    fontSize: 14,
    fontWeight: '600',
  },
  contestantsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  contestantCard: {
    width: 120,
    padding: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  contestantRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contestantRankText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  contestantImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: brand.flame,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contestantInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  contestantName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  contestantVotes: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  highlightsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  highlightCard: {
    width: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  highlightThumbnail: {
    height: 100,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playSmallIcon: {
    fontSize: 24,
    color: '#fff',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '600',
    padding: 10,
  },
  pastSeasonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  seasonCard: {
    width: '47%',
    padding: 12,
    borderRadius: radius.lg,
  },
  seasonImagePlaceholder: {
    height: 80,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seasonEmoji: {
    fontSize: 32,
  },
  seasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  seasonSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
