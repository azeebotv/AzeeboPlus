import React, { useState } from 'react';
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

const TABS = [
  { id: 'watchlist', label: 'Watchlist', emoji: '📋' },
  { id: 'history', label: 'History', emoji: '🕐' },
  { id: 'downloads', label: 'Downloads', emoji: '⬇️' },
  { id: 'purchases', label: 'Purchases', emoji: '🛒' },
];

const WATCHLIST_ITEMS = [
  { id: '1', title: 'Village President', universe: 'Reality', emoji: '📺', episodes: 24 },
  { id: '2', title: 'Breaking Bad', universe: 'Movies', emoji: '🎬', episodes: 62 },
  { id: '3', title: 'Daily Trivia Challenge', universe: 'Games', emoji: '🎮', episodes: 100 },
];

const HISTORY_ITEMS = [
  { id: '4', title: 'Money Heist', progress: 'S5 E3', watched: '2 days ago', emoji: '🎬' },
  { id: '5', title: 'Champions League', progress: 'Final', watched: '1 week ago', emoji: '⚽' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('watchlist');

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

  const renderWatchlist = () => (
    <FlatList
      data={WATCHLIST_ITEMS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.itemCard}
          onPress={() => router.push(`/watch/${item.id}`)}
        >
          <View style={styles.itemThumbnail}>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.universe} • {item.episodes} episodes</Text>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <Text style={styles.playButtonText}>▶</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptySubtitle}>Start adding content to watch later</Text>
        </View>
      }
    />
  );

  const renderHistory = () => (
    <FlatList
      data={HISTORY_ITEMS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.itemCard}
          onPress={() => router.push(`/watch/${item.id}`)}
        >
          <View style={styles.itemThumbnail}>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.progress} • Watched {item.watched}</Text>
          </View>
          <View style={styles.resumeIndicator}>
            <Text style={styles.resumeText}>Resume</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🕐</Text>
          <Text style={styles.emptyTitle}>No watch history</Text>
          <Text style={styles.emptySubtitle}>Content you watch will appear here</Text>
        </View>
      }
    />
  );

  const renderDownloads = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>⬇️</Text>
        <Text style={styles.emptyTitle}>No downloads</Text>
        <Text style={styles.emptySubtitle}>Download content to watch offline</Text>
        <TouchableOpacity style={styles.browseButton}>
          <Text style={styles.browseButtonText}>Browse Content</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPurchases = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>No purchases</Text>
        <Text style={styles.emptySubtitle}>Your purchased content will appear here</Text>
      </View>
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});