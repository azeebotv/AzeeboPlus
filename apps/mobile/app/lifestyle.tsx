import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const FEATURED_CONTENT = [
  { id: '1', title: 'Summer Fashion Trends 2024', category: 'Fashion', duration: '12:30', emoji: '👗' },
  { id: '2', title: 'Healthy Breakfast Recipes', category: 'Food', duration: '8:45', emoji: '🥗' },
  { id: '3', title: 'Home Decor Ideas', category: 'Interior', duration: '15:20', emoji: '🏠' },
];

const TRENDING_NOW = [
  { id: '1', title: 'Minimalist Wardrobe Guide', views: '890K', emoji: '👔' },
  { id: '2', title: 'Quick Dinner Recipes', views: '670K', emoji: '🍝' },
  { id: '3', title: 'Fitness at Home', views: '1.2M', emoji: '💪' },
  { id: '4', title: 'Skincare Routine', views: '450K', emoji: '✨' },
];

const CATEGORIES = [
  { id: '1', name: 'Fashion', emoji: '👗', count: 124 },
  { id: '2', name: 'Food & Cooking', emoji: '🍳', count: 98 },
  { id: '3', name: 'Beauty', emoji: '💄', count: 156 },
  { id: '4', name: 'Fitness', emoji: '💪', count: 87 },
  { id: '5', name: 'Home', emoji: '🏠', count: 64 },
  { id: '6', name: 'Travel', emoji: '✈️', count: 52 },
];

const CREATORS_TO_FOLLOW = [
  { id: '1', name: 'StyleByChioma', followers: '890K', avatar: '👩‍🦱' },
  { id: '2', name: 'ChefBaba', followers: '1.2M', avatar: '👨‍🍳' },
  { id: '3', name: 'FitQueen', followers: '670K', avatar: '👩‍🦰' },
];

export default function LifestyleUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>✨ Lifestyle</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Lifestyle Universe
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryChip}>
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryName}>{cat.name}</Text>
            <Text style={styles.categoryCount}>{cat.count}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Featured
          </Text>
        </View>
        <FlatList
          data={FEATURED_CONTENT}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.featuredCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.featuredImagePlaceholder}>
                <Text style={styles.featuredEmoji}>{item.emoji}</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredCategory}>{item.category}</Text>
                <Text style={[styles.featuredTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Trending Now
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trendingList}>
          {TRENDING_NOW.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.trendingItem, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.trendingRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.trendingThumbnail}>
                <Text style={styles.trendingEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.trendingInfo}>
                <Text style={[styles.trendingTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.trendingViews}>👁️ {item.views}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Creators to Follow
          </Text>
        </View>
        <FlatList
          data={CREATORS_TO_FOLLOW}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.creatorsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.creatorCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarEmoji}>{item.avatar}</Text>
              </View>
              <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
              <Text style={styles.creatorFollowers}>{item.followers}</Text>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
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
    color: '#45B7D1',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
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
  categoryCount: {
    color: '#888',
    fontSize: 11,
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
    color: '#45B7D1',
    fontSize: 14,
    fontWeight: '600',
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredImagePlaceholder: {
    height: 140,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredEmoji: {
    fontSize: 48,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredCategory: {
    color: '#45B7D1',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendingList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 12,
  },
  trendingRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#45B7D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  trendingThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingEmoji: {
    fontSize: 24,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingViews: {
    color: '#888',
    fontSize: 12,
  },
  creatorsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    width: 120,
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
  creatorAvatarEmoji: {
    fontSize: 28,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorFollowers: {
    color: '#888',
    fontSize: 11,
    marginBottom: 10,
  },
  followButton: {
    backgroundColor: '#45B7D1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followButtonText: {
    color: '#000',
    fontSize: 11,
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