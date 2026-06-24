import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { contentApi } from '../../src/api';
import type { ContentItem } from '../../src/api/content';
import { colors, typography, spacing, radius, universeColors } from '../../src/theme';
import { EmptyState } from '../../src/components/StateContainers';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'reality', label: 'Reality', color: universeColors.reality },
    { key: 'creators', label: 'Creators', color: universeColors.creators },
    { key: 'lifestyle', label: 'Lifestyle', color: universeColors.lifestyle },
    { key: 'vertical', label: 'Vertical', color: universeColors.vertical },
  ];

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await contentApi.searchContent(searchQuery);
      setResults(response.data?.items || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const renderItem = ({ item }: { item: ContentItem }) => (
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
      </View>
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.contentCreator}>{item.creator.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#ffffff' },
      ]}
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Azeebo+..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}
            accessibilityLabel={`Filter by ${filter.label}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: activeFilter === filter.key }}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>⌕</Text>
          <Text style={styles.emptyTitle}>Search Azeebo+</Text>
          <Text style={styles.emptySubtitle}>Find videos, creators, and universes</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <EmptyState
              icon="⌕"
              title="No results found"
              description={`No content matches "${searchQuery}"`}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surfaceInput,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    color: colors.text.tertiary,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: 'rgba(232,66,10,0.15)',
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  resultsList: {
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
