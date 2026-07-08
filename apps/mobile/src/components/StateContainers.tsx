import {
  LoadingState as UILoadingState,
  EmptyState as UIEmptyState,
  ErrorState as UIErrorState,
  SuccessState as UISuccessState,
} from '@azeebo/ui';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface LoadingStateProps {
  text?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ text = 'Loading...' }) => (
  <UILoadingState title={text} />
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
  <UIEmptyState
    icon={icon}
    title={title}
    description={description}
    buttonText={actionLabel}
    onButtonPress={onAction}
  />
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  onRetry,
  actionLabel,
}) => (
  <UIErrorState
    title={title}
    description={description}
    buttonText={actionLabel}
    onButtonPress={onRetry}
  />
);

interface SuccessStateProps {
  icon?: string;
  title: string;
  description?: string;
  onAction?: () => void;
  actionText?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  description,
  onAction,
  actionText,
}) => (
  <UISuccessState
    title={title}
    description={description}
    buttonText={actionText}
    onButtonPress={onAction}
  />
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
