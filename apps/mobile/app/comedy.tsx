import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingState, EmptyState, ErrorState } from '../src/components/StateContainers';
import { apiClient } from '../src/api/client';

interface ClipItem { id: string; title: string; views: string; likes: string; duration: string; emoji: string; }
interface CreatorItem { id: string; name: string; followers: string; emoji: string; }
interface CategoryItem { id: string; name: string; emoji: string; }
interface TopRatedItem { id: string; title: string; rating: string; emoji: string; }

export default function ComedyUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendingClips, setTrendingClips] = useState<ClipItem[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<CreatorItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [topRated, setTopRated] = useState<TopRatedItem[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clipsRes, creatorsRes, categoriesRes, topRes] = await Promise.all([
        apiClient.get<any>('/v1/comedy/clips'),
        apiClient.get<any>('/v1/comedy/creators'),
        apiClient.get<any>('/v1/comedy/categories'),
        apiClient.get<any>('/v1/comedy/top-rated'),
      ]);
      setTrendingClips(Array.isArray(clipsRes) ? clipsRes : clipsRes?.data ?? []);
      setFeaturedCreators(Array.isArray(creatorsRes) ? creatorsRes : creatorsRes?.data ?? []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data ?? []);
      setTopRated(Array.isArray(topRes) ? topRes : topRes?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (isLoading) return <LoadingState text="Loading comedy clips..." />;
  if (error) return <ErrorState description={error} onRetry={fetchData} />;
  if (!trendingClips.length && !featuredCreators.length) {
    return <EmptyState icon="😂" title="No clips available" description="Check back later for comedy content" />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>😂 Comedy</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Comedy Universe
        </Text>
      </View>

      <View style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryChip}>
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryName}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Trending Clips
        </Text>
        <FlatList
          data={trendingClips}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.clipCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.clipThumbnail}>
                <Text style={styles.clipEmoji}>{item.emoji}</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
                <View style={styles.viewsBadge}>
                  <Text style={styles.viewsText}>👁️ {item.views}</Text>
                </View>
              </View>
              <View style={styles.clipInfo}>
                <Text style={[styles.clipTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.clipMeta}>
                  <Text style={styles.likeCount}>❤️ {item.likes}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Featured Creators
          </Text>
        </View>
        <FlatList
          data={featuredCreators}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.creatorsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.creatorCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorEmoji}>{item.emoji}</Text>
              </View>
              <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
              <Text style={styles.creatorFollowers}>{item.followers}</Text>
              <TouchableOpacity style={styles.subscribeButton}>
                <Text style={styles.subscribeText}>Subscribe</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Top Rated
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.topRatedGrid}>
          {topRated.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.topRatedCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.topRatedThumbnail}>
                <Text style={styles.topRatedEmoji}>{item.emoji}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                </View>
              </View>
              <Text style={[styles.topRatedTitle, { color: isDark ? '#fff' : '#000' }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.comedyPassSection}>
        <View style={styles.comedyPassBanner}>
          <Text style={styles.comedyPassEmoji}>🎭</Text>
          <View style={styles.comedyPassInfo}>
            <Text style={styles.comedyPassTitle}>Comedy Pass</Text>
            <Text style={styles.comedyPassSubtitle}>All comedies from ₦1,500/month</Text>
          </View>
          <TouchableOpacity style={styles.comedyPassButton}>
            <Text style={styles.comedyPassButtonText}>Get</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
          <Text style={styles.navIcon}>📺</Text>
          <Text style={styles.navLabel}>Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/create')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navLabel}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navLabel}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  universeLabel: {
    fontSize: 14,
    color: '#F39C12',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    color: '#F39C12',
    fontSize: 14,
    fontWeight: '600',
  },
  trendingList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  clipCard: {
    width: 260,
    borderRadius: 12,
    overflow: 'hidden',
  },
  clipThumbnail: {
    height: 150,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clipEmoji: {
    fontSize: 48,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewsText: {
    color: '#fff',
    fontSize: 11,
  },
  clipInfo: {
    padding: 12,
  },
  clipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  clipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    color: '#888',
    fontSize: 12,
  },
  creatorsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    width: 130,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  creatorEmoji: {
    fontSize: 28,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorFollowers: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
  },
  subscribeButton: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  subscribeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  topRatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  topRatedCard: {
    width: '31%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  topRatedThumbnail: {
    height: 100,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topRatedEmoji: {
    fontSize: 36,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#FFEAA7',
    fontSize: 10,
    fontWeight: '600',
  },
  topRatedTitle: {
    fontSize: 11,
    fontWeight: '600',
    padding: 8,
  },
  comedyPassSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  comedyPassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  comedyPassEmoji: {
    fontSize: 36,
  },
  comedyPassInfo: {
    flex: 1,
  },
  comedyPassTitle: {
    color: '#F39C12',
    fontSize: 16,
    fontWeight: '700',
  },
  comedyPassSubtitle: {
    color: '#888',
    fontSize: 12,
  },
  comedyPassButton: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  comedyPassButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#888',
  },
});