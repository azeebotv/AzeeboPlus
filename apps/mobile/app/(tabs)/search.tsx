import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const universes = [
  { id: 'all', name: 'All', icon: '🎬', color: '#8B5CF6' },
  { id: 'reality', name: 'Reality', icon: '🎭', color: '#FF6B6B' },
  { id: 'creators', name: 'Creators', icon: '🎤', color: '#4ECDC4' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: '#45B7D1' },
  { id: 'vertical', name: 'Vertical', icon: '🏰', color: '#96CEB4' },
  { id: 'movies', name: 'Movies', icon: '🎬', color: '#FFEAA7' },
  { id: 'games', name: 'Games', icon: '🎮', color: '#DDA0DD' },
  { id: 'comedy', name: 'Comedy', icon: '😂', color: '#F39C12' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: '#E74C3C' },
];

const trendingSearches = [
  'Big Brother Naija',
  'Davido',
  'Game of Thrones',
  'Premier League',
  'Comedy Skits',
  'Fashion Week',
];

const PLACEHOLDER_IMAGE = '';

const searchResults: Array<{
  id: string;
  title: string;
  type: string;
  universe: string;
  thumbnail: string;
}> = [];

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const filteredResults = searchResults.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUniverse = selectedUniverse === 'all' || item.universe === selectedUniverse;
    return matchesQuery && matchesUniverse;
  });

  const renderSearchResults = () => (
    <View style={styles.resultsSection}>
      <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
        Results ({filteredResults.length})
      </Text>
      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => router.push(`/watch/${item.id}`)}
          >
            <Image source={{ uri: item.thumbnail }} style={styles.resultThumbnail} />
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {item.title}
              </Text>
              <View style={styles.resultMeta}>
                <Text style={styles.resultType}>{item.type}</Text>
                <Text style={styles.resultUniverse}>
                  {universes.find(u => u.id === item.universe)?.name}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderTrending = () => (
    <View style={styles.trendingSection}>
      <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
        Trending Searches
      </Text>
      <View style={styles.trendingList}>
        {trendingSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.trendingItem}
            onPress={() => handleSearch(search)}
          >
            <Text style={styles.trendingNumber}>{index + 1}</Text>
            <Text style={[styles.trendingText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
              {search}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}
            placeholder="Search Azeebo+"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.universeScroll}>
        {universes.map((universe) => (
          <TouchableOpacity
            key={universe.id}
            onPress={() => setSelectedUniverse(universe.id)}
            style={[
              styles.universeButton,
              selectedUniverse === universe.id && { backgroundColor: universe.color },
            ]}
          >
            <Text style={styles.universeIcon}>{universe.icon}</Text>
            <Text style={[styles.universeName, selectedUniverse === universe.id && { color: '#ffffff' }]}>
              {universe.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isSearching ? renderSearchResults() : renderTrending()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  searchHeader: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    color: '#fff',
    fontSize: 14,
  },
  universeScroll: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  universeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  universeIcon: {
    fontSize: 16,
  },
  universeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  trendingSection: {
    marginTop: 16,
  },
  trendingList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  trendingNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  trendingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  resultsSection: {
    marginTop: 16,
  },
  resultItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  resultThumbnail: {
    width: 100,
    height: 56,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  resultType: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  resultUniverse: {
    fontSize: 12,
    color: '#888',
  },
});
