import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme';
import { moderationApi, Report } from '../../src/api/moderation';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { logger } from '../../src/utils/logger';

type StatusFilter = 'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: colors.warning[500], bg: colors.warning[500] + '20' },
  reviewing: { label: 'Reviewing', color: colors.info[500], bg: colors.info[500] + '20' },
  resolved: { label: 'Resolved', color: colors.success[500], bg: colors.success[500] + '20' },
  dismissed: { label: 'Dismissed', color: colors.text.tertiary, bg: colors.text.tertiary + '20' },
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
];

export default function ModerationStatusScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    loadReports(true);
  }, [filter]);

  const loadReports = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const statusFilter = filter === 'all' ? undefined : filter;
      const response = await moderationApi.getUserReports(reset ? 1 : page, 20, statusFilter);

      if (response.success && response.data) {
        const items = response.data.items || [];
        setReports((prev) => (reset ? items : [...prev, ...items]));
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      logger.error('Failed to load reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !loadingMore) {
      setPage((prev) => prev + 1);
      loadReports(false);
    }
  }, [page, totalPages, loadingMore]);

  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <View style={[styles.badgeDot, { backgroundColor: config.color }]} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderReport = ({ item }: { item: Report }) => (
    <View
      style={[
        styles.reportCard,
        {
          backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
        },
      ]}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text
            style={[
              styles.reportTitle,
              { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
            ]}
            numberOfLines={1}
          >
            {item.contentTitle || `${item.contentType} content`}
          </Text>
          <Text style={styles.reportDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.reportReason}>
        <Text style={styles.reasonLabel}>Reason:</Text>
        <Text style={styles.reasonValue}>{item.reason}</Text>
      </View>

      {item.description ? (
        <Text
          style={[styles.reportDescription, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      ) : null}

      {item.reviewerNote ? (
        <View style={styles.reviewerNote}>
          <Text style={styles.reviewerLabel}>Reviewer note:</Text>
          <Text style={styles.reviewerText}>{item.reviewerNote}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderFilterTabs = () => (
    <FlatList
      horizontal
      data={FILTERS}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterList}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === item.key && styles.filterTabActive,
            {
              backgroundColor:
                filter === item.key
                  ? colors.primary[500]
                  : colorScheme === 'dark'
                    ? colors.bg.secondary
                    : colors.light[100],
            },
          ]}
          onPress={() => setFilter(item.key)}
        >
          <Text
            style={[
              styles.filterText,
              filter === item.key && styles.filterTextActive,
              {
                color:
                  filter === item.key
                    ? colors.text.primary
                    : colorScheme === 'dark'
                      ? colors.text.secondary
                      : colors.dark[600],
              },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <LoadingState text="Loading reports..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <ErrorState description={error} onRetry={() => loadReports(true)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
          ]}
        >
          My Reports
        </Text>
        <View style={styles.backButton} />
      </View>

      {renderFilterTabs()}

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No reports found"
            description={
              filter === 'all'
                ? "You haven't submitted any reports yet."
                : `No reports with status "${filter}".`
            }
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
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
  filterList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: colors.primary[500],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginRight: 6,
  },
  reasonValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewerNote: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 8,
  },
  reviewerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  reviewerText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
});
