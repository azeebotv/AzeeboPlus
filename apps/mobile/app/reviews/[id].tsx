import { useState, useEffect } from 'react';
import { logger } from '../../src/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/api';
import { colors, typography, spacing, radius } from '../../src/theme';
import { GlassCard, BrandButton } from '../../src/components/ui';
import { PageTransition } from '../../src/components/motion';

interface Review {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  rating: number;
  title?: string;
  body: string;
  hasSpoilers: boolean;
  helpfulCount: number;
  createdAt: string;
}

interface RatingSummary {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');
  const [myTitle, setMyTitle] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  useEffect(() => {
    loadReviews();
  }, [id, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [reviewsRes, summaryRes] = await Promise.all([
        apiClient.get<{ data?: { items?: Review[] } }>(
          `/v1/content/reviews/content/${id}?sort=${sortBy}`
        ),
        apiClient.get<{ data?: RatingSummary }>(`/v1/content/reviews/content/${id}/summary`),
      ]);
      setReviews(reviewsRes.data?.items || []);
      setSummary(summaryRes.data || null);
    } catch (error) {
      logger.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (myRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/v1/content/reviews', {
        contentId: id,
        rating: myRating,
        title: myTitle || undefined,
        body: myReview,
        hasSpoilers,
      });
      setShowForm(false);
      setMyRating(0);
      setMyReview('');
      setMyTitle('');
      setHasSpoilers(false);
      loadReviews();
      Alert.alert('Success', 'Your review has been submitted');
    } catch {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      await apiClient.post(`/v1/content/reviews/${reviewId}/helpful`);
      loadReviews();
    } catch (error) {
      logger.error('Failed to mark helpful:', error);
    }
  };

  const handleReport = async (reviewId: string) => {
    Alert.alert('Report Review', 'Why are you reporting this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Spam',
        onPress: async () => {
          await apiClient.post(`/v1/content/reviews/${reviewId}/report`, { reason: 'spam' });
          Alert.alert('Thank you', 'Review reported');
        },
      },
      {
        text: 'Inappropriate',
        onPress: async () => {
          await apiClient.post(`/v1/content/reviews/${reviewId}/report`, {
            reason: 'inappropriate',
          });
          Alert.alert('Thank you', 'Review reported');
        },
      },
    ]);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && setMyRating(star)}
          >
            <Text style={[styles.star, star <= rating && styles.starFilled]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <PageTransition>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Reviews</Text>
          {user && (
            <BrandButton
              title="Write a Review"
              onPress={() => setShowForm(!showForm)}
              variant="primary"
            />
          )}
        </View>

        {/* Rating Summary */}
        {summary && (
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.averageContainer}>
                <Text style={styles.averageRating}>{summary.average.toFixed(1)}</Text>
                {renderStars(Math.round(summary.average))}
                <Text style={styles.totalReviews}>{summary.total} reviews</Text>
              </View>
              <View style={styles.distributionContainer}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <View key={star} style={styles.distributionRow}>
                    <Text style={styles.distributionLabel}>{star}★</Text>
                    <View style={styles.distributionBar}>
                      <View
                        style={[
                          styles.distributionFill,
                          {
                            width: `${((summary.distribution[star] || 0) / summary.total) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.distributionCount}>{summary.distribution[star] || 0}</Text>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>
        )}

        {/* Write Review Form */}
        {showForm && (
          <GlassCard style={styles.formCard}>
            <Text style={styles.formTitle}>Your Review</Text>
            <View style={styles.ratingSelector}>
              <Text style={styles.label}>Rating:</Text>
              {renderStars(myRating, true)}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Review title (optional)"
              value={myTitle}
              onChangeText={setMyTitle}
              placeholderTextColor={colors.text.tertiary}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your review..."
              value={myReview}
              onChangeText={setMyReview}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.text.tertiary}
            />
            <TouchableOpacity
              style={styles.spoilerToggle}
              onPress={() => setHasSpoilers(!hasSpoilers)}
            >
              <Text style={styles.spoilerText}>{hasSpoilers ? '✓ ' : ''}Contains spoilers</Text>
            </TouchableOpacity>
            <View style={styles.formActions}>
              <BrandButton title="Cancel" onPress={() => setShowForm(false)} variant="ghost" />
              <BrandButton
                title="Submit"
                onPress={handleSubmitReview}
                loading={submitting}
                variant="primary"
              />
            </View>
          </GlassCard>
        )}

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          {(['recent', 'helpful', 'rating'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[styles.sortText, sortBy === option && styles.sortTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews List */}
        {reviews.map((review) => (
          <GlassCard key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>{review.username}</Text>
                {renderStars(review.rating)}
              </View>
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
            <Text style={[styles.reviewBody, review.hasSpoilers && styles.spoiler]}>
              {review.body}
            </Text>
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleHelpful(review.id)}
              >
                <Text style={styles.actionText}>👍 Helpful ({review.helpfulCount})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleReport(review.id)}>
                <Text style={styles.actionText}>⚑ Report</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}

        {reviews.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>Be the first to review!</Text>
          </View>
        )}
      </ScrollView>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  totalReviews: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  starFilled: {
    color: colors.warning[500],
  },
  distributionContainer: {
    flex: 1,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distributionLabel: {
    width: 30,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 4,
  },
  distributionFill: {
    height: '100%',
    backgroundColor: colors.warning[500],
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'right',
  },
  formCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  ratingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  input: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  spoilerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  spoilerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.tertiary,
  },
  sortOptionActive: {
    backgroundColor: colors.primary[500],
  },
  sortText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sortTextActive: {
    color: colors.text.primary,
  },
  reviewCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewerInfo: {
    gap: spacing.xs,
  },
  reviewerName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  reviewTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reviewBody: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  spoiler: {
    filter: 'blur(4px)',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionButton: {
    padding: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },
});
