import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const FEATURED_CREATORS = [
  { id: '1', name: 'Zara', followers: '2.4M', content: '245', avatar: '👩‍🎨', verified: true },
  { id: '2', name: 'Marcus', followers: '1.8M', content: '189', avatar: '👨‍🎤', verified: true },
  { id: '3', name: 'Lola', followers: '1.2M', content: '312', avatar: '👩‍🎤', verified: true },
  { id: '4', name: 'Tunde', followers: '890K', content: '156', avatar: '👨‍🎨', verified: false },
];

const TRENDING_CONTENT = [
  { id: '1', title: 'Afrobeat Dance Tutorial', views: '1.2M', creator: 'Zara', likes: '89K', thumbnail: '💃' },
  { id: '2', title: 'Nigerian Cooking: Jollof Rice', views: '890K', creator: 'Lola', likes: '56K', thumbnail: '🍲' },
  { id: '3', title: 'Comedy Skit: Market Scene', views: '2.1M', creator: 'Marcus', likes: '156K', thumbnail: '😂' },
  { id: '4', title: 'Fashion Lookbook 2024', views: '670K', creator: 'Tunde', likes: '42K', thumbnail: '👗' },
];

const CATEGORIES = [
  { id: '1', name: 'Music', emoji: '🎵' },
  { id: '2', name: 'Dance', emoji: '💃' },
  { id: '3', name: 'Comedy', emoji: '😂' },
  { id: '4', name: 'Cooking', emoji: '🍳' },
  { id: '5', name: 'Fashion', emoji: '👗' },
  { id: '6', name: 'Vlogs', emoji: '📹' },
];

const CREATOR_CARDS = [
  { id: '1', title: 'Become a Creator', description: 'Start your journey and share your talents with the world', emoji: '✨', action: 'Sign up' },
  { id: '2', title: 'Monetize', description: 'Earn from your content and connect with your fans', emoji: '💰', action: 'Learn more' },
];

export default function CreatorUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>🎤 Creators</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Creator Universe
        </Text>
      </View>

      <View style={styles.createButtonBar}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/creators/signup')}
        >
          <Text style={styles.createIcon}>✨</Text>
          <Text style={styles.createText}>Start Creating</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.push('/creators/dashboard')}
        >
          <Text style={styles.dashboardIcon}>📊</Text>
          <Text style={styles.dashboardText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryButton}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Featured Creators
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={FEATURED_CREATORS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.creatorsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.creatorCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarEmoji}>{item.avatar}</Text>
                {item.verified && <View style={styles.verifiedBadge} />}
              </View>
              <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
              <View style={styles.creatorStats}>
                <Text style={styles.creatorStat}>{item.followers}</Text>
                <Text style={styles.creatorStatSeparator}>•</Text>
                <Text style={styles.creatorStat}>{item.content}</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followText}>Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Trending Content
        </Text>
        <View style={styles.contentGrid}>
          {TRENDING_CONTENT.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.contentCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.contentThumbnail}>
                <Text style={styles.contentThumbnailEmoji}>{item.thumbnail}</Text>
                <View style={styles.contentViews}>
                  <Text style={styles.viewIcon}>👁️</Text>
                  <Text style={styles.viewCount}>{item.views}</Text>
                </View>
              </View>
              <View style={styles.contentInfo}>
                <Text style={[styles.contentTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.contentMeta}>
                  <Text style={styles.creatorTag}>{item.creator}</Text>
                  <Text style={styles.likeCount}>❤️ {item.likes}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.cardsSection}>
        <View style={styles.cardsRow}>
          {CREATOR_CARDS.map((card) => (
            <TouchableOpacity key={card.id} style={[styles.infoCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#000' }]}>{card.title}</Text>
              <Text style={styles.cardDesc}>{card.description}</Text>
              <TouchableOpacity style={styles.cardButton}>
                <Text style={styles.cardButtonText}>{card.action}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
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
          <Text style={[styles.navLabel, { color: '#4ECDC4' }]}>Create</Text>
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
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  createButtonBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  createIcon: {
    fontSize: 20,
  },
  createText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  dashboardIcon: {
    fontSize: 20,
  },
  dashboardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryButton: {
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
  },
  seeAllText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  creatorsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  creatorAvatarEmoji: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  creatorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  creatorStat: {
    color: '#888',
    fontSize: 12,
  },
  creatorStatSeparator: {
    color: '#444',
  },
  followButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  contentCard: {
    width: '47%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  contentThumbnail: {
    height: 120,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  contentThumbnailEmoji: {
    fontSize: 40,
  },
  contentViews: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  viewIcon: {
    fontSize: 12,
  },
  viewCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  contentInfo: {
    padding: 10,
  },
  contentTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorTag: {
    color: '#4ECDC4',
    fontSize: 11,
    fontWeight: '500',
  },
  likeCount: {
    color: '#888',
    fontSize: 11,
  },
  cardsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDesc: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  cardButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardButtonText: {
    color: '#000',
    fontSize: 12,
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