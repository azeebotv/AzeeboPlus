import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { lifestyleApi, Celebrity } from '../../src/api/lifestyle';

export default function CelebritiesScreen() {
  const router = useRouter();

  const celebritiesQuery = useQuery({
    queryKey: ['lifestyle', 'celebrities'],
    queryFn: async () => {
      const res = await lifestyleApi.getCelebrities();
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const featuredQuery = useQuery({
    queryKey: ['lifestyle', 'celebrities', 'featured'],
    queryFn: async () => {
      const res = await lifestyleApi.getFeaturedCelebrities();
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const celebrities = celebritiesQuery.data ?? [];
  const featured = featuredQuery.data ?? [];
  const isLoading = celebritiesQuery.isLoading || featuredQuery.isLoading;
  const error = celebritiesQuery.error?.message || featuredQuery.error?.message;

  const handleRefresh = useCallback(() => {
    celebritiesQuery.refetch();
    featuredQuery.refetch();
  }, [celebritiesQuery, featuredQuery]);

  const renderCelebrity = ({ item }: { item: Celebrity }) => (
    <TouchableOpacity
      style={[styles.celebrityCard, { backgroundColor: colors.bg.tertiary }]}
      onPress={() => router.push(`/lifestyle/celebrity-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.photo || 'https://placehold.co/120x120/1a1a1a/ffffff?text=★',
        }}
        style={styles.celebrityPhoto}
        resizeMode="cover"
      />
      <View style={styles.celebrityInfo}>
        <Text style={[styles.celebrityName, { color: colors.text.primary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          style={[styles.celebrityProfession, { color: colors.text.secondary }]}
          numberOfLines={1}
        >
          {item.profession}
        </Text>
        <View style={styles.followerBadge}>
          <Text style={styles.followerIcon}>👥</Text>
          <Text style={styles.followerText}>{formatCount(item.followerCount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeatured = ({ item }: { item: Celebrity }) => (
    <TouchableOpacity
      style={[styles.featuredCard, { backgroundColor: colors.bg.tertiary }]}
      onPress={() => router.push(`/lifestyle/celebrity-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.photo || 'https://placehold.co/300x400/1a1a1a/ffffff?text=★',
        }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredInfo}>
        <Text style={[styles.featuredName, { color: colors.text.primary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.featuredProfession, { color: colors.text.secondary }]}>
          {item.profession}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Celebrities</Text>
          <View style={styles.backButton} />
        </View>

        {isLoading && <LoadingState text="Loading celebrities..." />}
        {error && <ErrorState description={error} onRetry={handleRefresh} />}
        {!isLoading && !error && celebrities.length === 0 && (
          <EmptyState
            icon="⭐"
            title="No celebrities found"
            description="Check back later for featured celebrities"
          />
        )}

        {!isLoading && !error && celebrities.length > 0 && (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <>
                {featured.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                        ⭐ Featured
                      </Text>
                    </View>
                    <FlatList
                      data={featured}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredScroll}
                      keyExtractor={(item) => item.id}
                      renderItem={renderFeatured}
                    />
                  </View>
                )}

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                      All Celebrities
                    </Text>
                  </View>
                  <View style={styles.celebritiesGrid}>
                    {celebrities.map((celeb) => (
                      <View key={celeb.id}>{renderCelebrity({ item: celeb })}</View>
                    ))}
                  </View>
                </View>
              </>
            }
            refreshControl={
              <RefreshControl
                refreshing={celebritiesQuery.isRefetching || featuredQuery.isRefetching}
                onRefresh={handleRefresh}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
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
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  featuredCard: {
    width: 200,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredProfession: {
    fontSize: 13,
  },
  celebritiesGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  celebrityCard: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  celebrityPhoto: {
    width: '100%',
    height: 160,
  },
  celebrityInfo: {
    padding: 12,
  },
  celebrityName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  celebrityProfession: {
    fontSize: 12,
    marginBottom: 8,
  },
  followerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followerIcon: {
    fontSize: 12,
  },
  followerText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
