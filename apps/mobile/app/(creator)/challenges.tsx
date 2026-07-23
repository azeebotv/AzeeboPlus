import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme';
import {
  moderationApi,
  Challenge,
  ChallengeSubmission,
} from '../../src/api/moderation';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { logger } from '../../src/utils/logger';

type Tab = 'active' | 'submissions';

export default function ChallengesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('active');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submission modal state
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitContentUrl, setSubmitContentUrl] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPage(1);
    loadData(true);
  }, [tab]);

  const loadData = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;

      if (tab === 'active') {
        const response = await moderationApi.getActiveChallenges(currentPage, 20);
        if (response.success && response.data) {
          const items = response.data.items || [];
          setChallenges((prev) => (reset ? items : [...prev, ...items]));
          setTotalPages(response.data.totalPages || 1);
        }
      } else {
        const response = await moderationApi.getMySubmissions(currentPage, 20);
        if (response.success && response.data) {
          const items = response.data.items || [];
          setSubmissions((prev) => (reset ? items : [...prev, ...items]));
          setTotalPages(response.data.totalPages || 1);
        }
      }
    } catch (err) {
      logger.error('Failed to load challenges:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !loadingMore) {
      setPage((prev) => prev + 1);
      loadData(false);
    }
  }, [page, totalPages, loadingMore]);

  const handleSubmitEntry = async () => {
    if (!selectedChallenge) return;
    if (!submitContentUrl.trim()) {
      Alert.alert('Error', 'Please enter a content URL');
      return;
    }
    if (!submitDescription.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    setSubmitting(true);
    try {
      const response = await moderationApi.submitChallengeEntry({
        challengeId: selectedChallenge.id,
        contentUrl: submitContentUrl.trim(),
        description: submitDescription.trim(),
      });

      if (response.success) {
        setShowSubmitModal(false);
        setSelectedChallenge(null);
        setSubmitContentUrl('');
        setSubmitDescription('');
        Alert.alert('Success', 'Your entry has been submitted!');
        if (tab === 'submissions') {
          loadData(true);
        }
      } else {
        Alert.alert('Error', 'Failed to submit entry. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to submit challenge entry:', err);
      Alert.alert('Error', 'Failed to submit entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    submitted: { label: 'Submitted', color: colors.info[500], bg: colors.info[500] + '20' },
    under_review: { label: 'Under Review', color: colors.warning[500], bg: colors.warning[500] + '20' },
    approved: { label: 'Approved', color: colors.success[500], bg: colors.success[500] + '20' },
    rejected: { label: 'Rejected', color: colors.error[500], bg: colors.error[500] + '20' },
  };

  const renderChallengeCard = ({ item }: { item: Challenge }) => (
    <View
      style={[
        styles.challengeCard,
        {
          backgroundColor:
            colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
        },
      ]}
    >
      <View style={styles.challengeHeader}>
        <View
          style={[
            styles.rewardBadge,
            { backgroundColor: colors.primary[500] + '20' },
          ]}
        >
          <Text style={styles.rewardIcon}>🏆</Text>
          <Text style={styles.rewardText}>{item.rewardPoints.toLocaleString()} pts</Text>
        </View>
        <Text style={styles.challengeDate}>
          Ends {new Date(item.endDate).toLocaleDateString()}
        </Text>
      </View>

      <Text
        style={[
          styles.challengeTitle,
          { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
        ]}
      >
        {item.title}
      </Text>

      <Text
        style={[styles.challengeDescription, { color: colors.text.secondary }]}
        numberOfLines={3}
      >
        {item.description}
      </Text>

      {item.rules && item.rules.length > 0 ? (
        <View style={styles.rulesPreview}>
          {item.rules.slice(0, 2).map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <Text style={styles.ruleNumber}>{index + 1}</Text>
              <Text style={[styles.ruleText, { color: colors.text.secondary }]} numberOfLines={1}>
                {rule}
              </Text>
            </View>
          ))}
          {item.rules.length > 2 ? (
            <Text style={styles.moreRules}>+{item.rules.length - 2} more rules</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.challengeMeta}>
        <Text style={styles.metaText}>
          {item.participantCount} participants
        </Text>
        {item.maxParticipants ? (
          <Text style={styles.metaText}>
            {item.maxParticipants - item.participantCount} spots left
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          item.status !== 'active' && styles.submitButtonDisabled,
        ]}
        onPress={() => {
          setSelectedChallenge(item);
          setShowSubmitModal(true);
        }}
        disabled={item.status !== 'active'}
      >
        <Text style={styles.submitButtonText}>
          {item.status === 'active' ? 'Submit Entry' : 'Challenge Ended'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubmissionCard = ({ item }: { item: ChallengeSubmission }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
    return (
      <View
        style={[
          styles.submissionCard,
          {
            backgroundColor:
              colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
          },
        ]}
      >
        <View style={styles.submissionHeader}>
          <Text
            style={[
              styles.submissionTitle,
              { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
            ]}
            numberOfLines={1}
          >
            {item.challengeTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.submissionDescription, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        {item.reviewerNote ? (
          <View style={styles.reviewerNote}>
            <Text style={styles.reviewerLabel}>Reviewer note:</Text>
            <Text style={styles.reviewerText}>{item.reviewerNote}</Text>
          </View>
        ) : null}

        <Text style={styles.submissionDate}>
          Submitted {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <LoadingState text="Loading challenges..." />
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
        <ErrorState description={error} onRetry={() => loadData(true)} />
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
          Challenges
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabBar}>
        {(['active', 'submissions'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tab,
              tab === t && styles.tabActive,
              {
                backgroundColor:
                  tab === t
                    ? colors.primary[500]
                    : colorScheme === 'dark'
                      ? colors.bg.secondary
                      : colors.light[100],
              },
            ]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                styles.tabText,
                tab === t && styles.tabTextActive,
                {
                  color:
                    tab === t
                      ? colors.text.primary
                      : colorScheme === 'dark'
                        ? colors.text.secondary
                        : colors.dark[600],
                },
              ]}
            >
              {t === 'active' ? 'Active Challenges' : 'My Submissions'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'active' ? (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={renderChallengeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="🎯"
              title="No active challenges"
              description="Check back later for new challenges."
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
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          renderItem={renderSubmissionCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="📝"
              title="No submissions yet"
              description="Submit an entry to a challenge to see it here."
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
      )}

      <Modal visible={showSubmitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor:
                  colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
              ]}
            >
              Submit Challenge Entry
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedChallenge?.title}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Content URL</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : colors.light[100],
                    color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary,
                  },
                ]}
                value={submitContentUrl}
                onChangeText={setSubmitContentUrl}
                placeholder="https://..."
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[
                  styles.formTextArea,
                  {
                    backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : colors.light[100],
                    color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary,
                  },
                ]}
                value={submitDescription}
                onChangeText={setSubmitDescription}
                placeholder="Describe your entry..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowSubmitModal(false);
                  setSelectedChallenge(null);
                  setSubmitContentUrl('');
                  setSubmitDescription('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  submitting && styles.modalConfirmDisabled,
                ]}
                onPress={handleSubmitEntry}
                disabled={submitting}
              >
                <Text style={styles.modalConfirmText}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  challengeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardText: {
    color: colors.primary[500],
    fontSize: 13,
    fontWeight: '700',
  },
  challengeDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  rulesPreview: {
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ruleNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg.tertiary,
    color: colors.text.tertiary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
  },
  moreRules: {
    fontSize: 12,
    color: colors.primary[500],
    fontWeight: '500',
    marginLeft: 28,
  },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.bg.tertiary,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  submissionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submissionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewerNote: {
    padding: 12,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 8,
    marginBottom: 8,
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
  submissionDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  formInput: {
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  formTextArea: {
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 2,
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmDisabled: {
    backgroundColor: colors.bg.tertiary,
  },
  modalConfirmText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
