import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { useSavedContent, useRecentContent } from '@azeebo/react-data/hooks/useContentQuery';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

const TABS = [
  { id: 'watchlist', label: 'Watchlist', emoji: '📋' },
  { id: 'history', label: 'History', emoji: '🕐' },
  { id: 'downloads', label: 'Downloads', emoji: '⬇️' },
  { id: 'purchases', label: 'Purchases', emoji: '🛒' },
];

export default function LibraryScreen() {
  const router = useRouter();
  useAuth();
  const [activeTab, setActiveTab] = useState('watchlist');

  const {
    data: savedData,
    isLoading: savedLoading,
    error: savedError,
    refetch: refetchSaved,
  } = useSavedContent(1, 50);
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useRecentContent(1, 50);

  const isLoading = savedLoading || historyLoading;
  const error = savedError?.message || historyError?.message || null;

  const watchlist = (savedData?.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    thumbnail: item.thumbnail,
    savedAt: item.createdAt,
    type: item.contentType ?? 'content',
  }));

  const history = (historyData?.items ?? []).map((item) => ({
    id: item.id,
    contentId: item.id,
    title: item.title,
    thumbnail: item.thumbnail,
    watchedAt: item.updatedAt,
    progress: 0,
    duration: item.duration ?? 0,
  }));

  if (isLoading) {
    return <LoadingState text="Loading your library..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load library"
        description={error}
        onRetry={() => {
          refetchSaved();
          refetchHistory();
        }}
      />
    );
  }

  const renderTab = (tab: (typeof TABS)[0]) => (
    <TouchableOpacity
      key={tab.id}
      style={[styles.tab, activeTab === tab.id && styles.tabActive]}
      onPress={() => setActiveTab(tab.id)}
    >
      <Text style={styles.tabEmoji}>{tab.emoji}</Text>
      <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );

  const renderWatchlist = () => {
    if (!watchlist.length) {
      return (
        <EmptyState
          icon="📋"
          title="Your watchlist is empty"
          description="Start adding content to watch later"
        />
      );
    }
    return (
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() =>
              router.push(
                `/watch/${(item as { contentId?: string; id: string }).contentId || item.id}`
              )
            }
          >
            <View style={styles.itemThumbnail}>
              <Text style={styles.itemEmoji}>📺</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.type || 'Content'}</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderHistory = () => {
    if (!history.length) {
      return (
        <EmptyState
          icon="🕐"
          title="No watch history"
          description="Content you watch will appear here"
        />
      );
    }
    return (
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push(`/watch/${item.contentId}`)}
          >
            <View style={styles.itemThumbnail}>
              <Text style={styles.itemEmoji}>🎬</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{Math.round(item.progress)}% complete</Text>
            </View>
            <View style={styles.resumeIndicator}>
              <Text style={styles.resumeText}>Resume</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderDownloads = () => (
    <EmptyState icon="⬇️" title="No downloads" description="Download content to watch offline" />
  );

  const renderPurchases = () => (
    <EmptyState
      icon="🛒"
      title="No purchases"
      description="Your purchased content will appear here"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <View style={styles.tabsContainer}>{TABS.map(renderTab)}</View>

      {activeTab === 'watchlist' && renderWatchlist()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'downloads' && renderDownloads()}
      {activeTab === 'purchases' && renderPurchases()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    gap: 6,
  },
  tabActive: {
    backgroundColor: brand.flame,
  },
  tabEmoji: {
    fontSize: 14,
  },
  tabLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    color: colors.text.tertiary,
    fontSize: 13,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brand.flame,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  resumeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
  },
  resumeText: {
    color: brand.flame,
    fontSize: 12,
    fontWeight: '600',
  },
});
