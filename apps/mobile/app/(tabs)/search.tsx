import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRENDING_SEARCHES = [
  'Big Brother Naija',
  'Nigerian Movies',
  'Comedy Skits',
  'Sports Highlights',
  'Reality TV Shows',
  'Gaming Streams',
];

const RECENT_SEARCHES = ['Money Heist', 'Champions League'];

interface SearchResult {
  id: string;
  title: string;
}

const EmptyStateComponent: React.FC = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyEmoji}>🔍</Text>
    <Text style={styles.emptyTitle}>No results found</Text>
    <Text style={styles.emptySubtitle}>
      Try different keywords or browse categories
    </Text>
  </View>
);

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecent, setShowRecent] = useState(true);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setShowRecent(false);
    }
  };

  const handleTrendingPress = (term: string) => {
    setSearchQuery(term);
    setShowRecent(false);
  };

  const handleRecentPress = (term: string) => {
    setSearchQuery(term);
    setShowRecent(false);
  };

  const emptyContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search content, creators, universes..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showRecent ? (
        <View style={styles.content}>
          {RECENT_SEARCHES.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity>
                  <Text style={styles.clearAll}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {RECENT_SEARCHES.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => handleRecentPress(term)}
                >
                  <Text style={styles.recentIcon}>🕐</Text>
                  <Text style={styles.recentText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <View style={styles.trendingContainer}>
              {TRENDING_SEARCHES.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.trendingChip}
                  onPress={() => handleTrendingPress(term)}
                >
                  <Text style={styles.trendingText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Universe</Text>
            <View style={styles.universeGrid}>
              {[
                { name: 'Reality', emoji: '📺', color: '#FF6B6B' },
                { name: 'Movies', emoji: '🎬', color: '#4ECDC4' },
                { name: 'Games', emoji: '🎮', color: '#45B7D1' },
                { name: 'Comedy', emoji: '😂', color: '#96CEB4' },
                { name: 'Sports', emoji: '⚽', color: '#FFEAA7' },
                { name: 'Lifestyle', emoji: '🌟', color: '#DDA0DD' },
              ].map((universe, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.universeCard, { borderColor: universe.color }]}
                  onPress={() => router.push('/(tabs)/home')}
                >
                  <Text style={styles.universeEmoji}>{universe.emoji}</Text>
                  <Text style={styles.universeName}>{universe.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <FlatList<SearchResult>
          data={[]}
          keyExtractor={() => 'empty'}
          ListEmptyComponent={EmptyStateComponent}
          contentContainerStyle={emptyContainerStyle}
          renderItem={() => null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  clearIcon: {
    fontSize: 16,
    color: '#666',
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  clearAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  recentIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  recentText: {
    fontSize: 16,
    color: '#fff',
  },
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trendingChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  trendingText: {
    fontSize: 14,
    color: '#fff',
  },
  universeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  universeCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  universeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  universeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
