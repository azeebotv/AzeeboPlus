import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { contentApi } from '../../src/api';

const TABS = [
  { id: 'watchlist', label: 'Watchlist', emoji: '📋' },
  { id: 'history', label: 'History', emoji: '🕐' },
  { id: 'downloads', label: 'Downloads', emoji: '⬇️' },
  { id: 'purchases', label: 'Purchases', emoji: '🛒' },
];

interface WatchlistItem {
  id: string;
  title: string;
  thumbnail: string;
  savedAt: string;
  type: string;
}

interface HistoryItem {
  id: string;
  contentId: string;
  title: string;
  thumbnail: string;
  watchedAt: string;
  progress: number;
  duration: number;
}

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('watchlist');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [savedRes, historyRes] = await Promise.all([
        contentApi.getSavedContent(1, 50),
        contentApi.getWatchHistory(1, 50),
      ]);
      if (savedRes.success && savedRes.data) {
        setWatchlist(savedRes.data.items as any);
      }
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.items as any);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingState text="Loading your library..." />;
  }

  if (error) {
    return <ErrorState title="Failed to load library" description={error} onRetry={fetchData} />;
  }

  const renderTab = (tab: typeof TABS[0]) => (
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
      return <EmptyState icon="📋" title="Your watchlist is empty" description="Start adding content to watch later" />;
    }
    return (
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push(`/watch/${item.contentId || item.id}`)}
          >
            <View style={styles.itemThumbnail}>
              <Text style={styles.itemEmoji}>📺</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.type || 'Content'}</Text>
            </View>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderHistory = () => {
    if (!history.length) {
      return <EmptyState icon="🕐" title="No watch history" description="Content you watch will appear here" />;
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
    <EmptyState icon="🛒" title="No purchases" description="Your purchased content will appear here" />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <View style={styles.tabsContainer}>
        {TABS.map(renderTab)}
      </View>

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
    backgroundColor: '#8B5CF6',
  },
  tabEmoji: {
    fontSize: 14,
  },
  tabLabel: {
    color: '#888',
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
    backgroundColor: '#333',
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
    color: '#666',
    fontSize: 13,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#333',
  },
  resumeText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
});