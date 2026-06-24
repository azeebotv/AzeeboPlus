import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, typography, spacing, shadows } from '../theme';

interface LoadingStateProps {
  text?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ text = 'Loading...' }) => (
  <View
    style={styles.container}
    accessibilityRole="alert"
    accessibilityLabel={`Loading: ${text}`}
    accessibilityLiveRegion="polite"
  >
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <View
    style={styles.container}
    accessibilityRole="none"
    accessibilityLabel={`Empty state: ${title}. ${description || ''}`}
  >
    <Text style={styles.icon} accessibilityElementsHidden>
      {icon}
    </Text>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {actionLabel && onAction && (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={styles.retryButtonText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description,
  onRetry,
  actionLabel,
}) => (
  <View
    style={styles.container}
    accessibilityRole="alert"
    accessibilityLabel={`Error: ${title}. ${description || ''}`}
  >
    <Text style={styles.icon} accessibilityElementsHidden>
      ❌
    </Text>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {onRetry && (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={actionLabel || 'Retry'}
      >
        <Text style={styles.retryButtonText}>{actionLabel || 'Retry'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface SuccessStateProps {
  icon?: string;
  title: string;
  description?: string;
  onAction?: () => void;
  actionText?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  icon = '✅',
  title,
  description,
  onAction,
  actionText = 'Continue',
}) => (
  <View
    style={styles.container}
    accessibilityRole="text"
    accessibilityLabel={`Success: ${title}. ${description || ''}`}
    accessibilityLiveRegion="polite"
  >
    <Text style={styles.icon} accessibilityElementsHidden>
      {icon}
    </Text>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {onAction && (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionText}
      >
        <Text style={styles.retryButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface ContentCardSkeletonProps {
  style?: object;
}

export const ContentCardSkeleton: React.FC<ContentCardSkeletonProps> = ({ style }) => (
  <View style={[styles.skeletonCard, style]}>
    <View style={styles.skeletonThumbnail} />
    <View style={styles.skeletonInfo}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  text: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: 16,
    minHeight: 48,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.red,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  skeletonThumbnail: {
    width: 120,
    height: 80,
    backgroundColor: colors.bg.tertiary,
  },
  skeletonInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 8,
  },
  skeletonTitle: {
    height: 14,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.sm,
    width: '80%',
  },
  skeletonSubtitle: {
    height: 10,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.sm,
    width: '50%',
  },
});

export default {
  LoadingState,
  EmptyState,
  ErrorState,
  SuccessState,
  ContentCardSkeleton,
};
