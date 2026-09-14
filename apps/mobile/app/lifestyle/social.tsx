import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Share,
} from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { lifestyleApi, SavedItem } from '../../src/api/lifestyle';

export default function SocialScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const savedQuery = useQuery({
    queryKey: ['lifestyle', 'saved'],
    queryFn: async () => {
      const res = await lifestyleApi.getSavedItems();
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const unsaveMutation = useMutation({
    mutationFn: (itemId: string) => lifestyleApi.unsaveItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifestyle', 'saved'] });
    },
  });

  const savedItems = savedQuery.data ?? [];
  const isLoading = savedQuery.isLoading;
  const error = savedQuery.error?.message;

  const handleRefresh = useCallback(() => {
    savedQuery.refetch();
  }, [savedQuery]);

  const handleShare = useCallback(async (item: SavedItem) => {
    try {
      await Share.share({
        message: `Check out ${item.title} on Azeebo+`,
        title: item.title,
      });
    } catch {
      /* User cancelled share */
    }
  }, []);

  const handleRemove = useCallback(
    (itemId: string) => {
      unsaveMutation.mutate(itemId);
    },
    [unsaveMutation]
  );

  const navigateToItem = useCallback(
    (item: SavedItem) => {
      switch (item.type) {
        case 'event':
          router.push(`/lifestyle/event-detail?id=${item.id}`);
          break;
        case 'celebrity':
          router.push(`/lifestyle/celebrity-detail?id=${item.id}`);
          break;
        case 'influencer':
          router.push(`/lifestyle/influencer-detail?id=${item.id}`);
          break;
        case 'music':
          router.push('/music');
          break;
        case 'venue':
          router.push('/lifestyle/nightlife');
          break;
      }
    },
    [router]
  );

  const getTypeIcon = (type: SavedItem['type']) => {
    switch (type) {
      case 'event':
        return '📅';
      case 'music':
        return '🎵';
      case 'celebrity':
        return '⭐';
      case 'venue':
        return '🌙';
      case 'influencer':
        return '🌟';
      default:
        return '📌';
    }
  };

  const renderSavedItem = ({ item }: { item: SavedItem }) => (
    <View style={[styles.savedCard, { backgroundColor: colors.bg.tertiary }]}>
      <TouchableOpacity
        style={styles.savedCardMain}
        onPress={() => navigateToItem(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: item.image || 'https://placehold.co/80x80/1a1a1a/ffffff?text=📌',
          }}
          style={styles.savedImage}
          resizeMode="cover"
        />
        <View style={styles.savedInfo}>
          <View style={styles.savedTypeBadge}>
            <Text style={styles.savedTypeIcon}>{getTypeIcon(item.type)}</Text>
            <Text style={styles.savedTypeText}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          <Text style={[styles.savedTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.savedSubtitle, { color: colors.text.secondary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
          <Text style={[styles.savedDate, { color: colors.text.tertiary }]}>
            Saved {item.savedAt}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.savedActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.bg.surface }]}
          onPress={() => handleShare(item)}
        >
          <Text style={styles.actionIcon}>↗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.bg.surface }]}
          onPress={() => handleRemove(item.id)}
        >
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Saved Items</Text>
          <View style={styles.backButton} />
        </View>

        {isLoading && <LoadingState text="Loading saved items..." />}
        {error && <ErrorState description={error} onRetry={handleRefresh} />}
        {!isLoading && !error && savedItems.length === 0 && (
          <EmptyState
            icon="📌"
            title="No saved items"
            description="Save items from the Lifestyle universe to see them here"
          />
        )}

        {!isLoading && !error && savedItems.length > 0 && (
          <>
            <View style={styles.statsBar}>
              <Text style={[styles.statsText, { color: colors.text.secondary }]}>
                {savedItems.length} saved {savedItems.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <FlatList
              data={savedItems}
              keyExtractor={(item) => item.id}
              renderItem={renderSavedItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={savedQuery.isRefetching} onRefresh={handleRefresh} />
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
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
  statsBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statsText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  savedCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  savedCardMain: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  savedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  savedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  savedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  savedTypeIcon: {
    fontSize: 12,
  },
  savedTypeText: {
    color: colors.primary[500],
    fontSize: 11,
    fontWeight: '600',
  },
  savedTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  savedSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  savedDate: {
    fontSize: 11,
  },
  savedActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    color: colors.text.secondary,
    fontSize: 14,
  },
});
