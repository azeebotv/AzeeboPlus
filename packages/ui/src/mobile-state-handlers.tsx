import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, spacingNative, borderRadius, fontSizeNative, fontWeightNative } from '@azeebo/design-tokens';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
  color = colors.primary,
}) => {
  // Map our custom sizes to react-native's ActivityIndicator size options
  const indicatorSize: 'small' | 'large' = size === 'small' ? 'small' : 'large';

  const containerStyle: ViewStyle = fullScreen
    ? { ...styles.fullScreenContainer }
    : { ...styles.container };

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={indicatorSize} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.emptyContainer}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  errorCode?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  errorCode,
}) => {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <Text style={styles.errorIcon}>!</Text>
      </View>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {errorCode && <Text style={styles.errorCode}>Error code: {errorCode}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface SuccessStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.successContainer}>
      <View style={styles.successIconContainer}>
        {icon || <Text style={styles.successIcon}>✓</Text>}
      </View>
      <Text style={styles.successTitle}>{title}</Text>
      {message && <Text style={styles.successMessage}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface StateHandlerProps<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null | undefined;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
}

export function StateHandler<T>({
  isLoading,
  error,
  data,
  loadingMessage,
  emptyTitle = 'No data',
  emptyMessage = 'There is nothing to display here.',
  onRetry,
  children,
}: StateHandlerProps<T>) {
  if (isLoading) {
    return <Loading message={loadingMessage || 'Loading...'} />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={onRetry ? 'Refresh' : undefined}
        onAction={onRetry}
      />
    );
  }

  return <>{children(data)}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingNative.lg,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    zIndex: 100,
  },
  message: {
    marginTop: spacingNative.md,
    fontSize: fontSizeNative.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingNative.xl,
  },
  iconContainer: {
    marginBottom: spacingNative.md,
  },
  emptyTitle: {
    fontSize: fontSizeNative.lg,
    fontWeight: fontWeightNative.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacingNative.sm,
  },
  emptyMessage: {
    fontSize: fontSizeNative.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacingNative.lg,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingNative.lg,
    paddingVertical: spacingNative.sm,
    borderRadius: 8,
  },
  actionButtonText: {
    color: colors.text.primary,
    fontSize: fontSizeNative.md,
    fontWeight: fontWeightNative.semibold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingNative.xl,
  },
  errorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacingNative.md,
  },
  errorIcon: {
    fontSize: 24,
    fontWeight: fontWeightNative.bold,
    color: colors.text.primary,
  },
  errorTitle: {
    fontSize: fontSizeNative.lg,
    fontWeight: fontWeightNative.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacingNative.sm,
  },
  errorMessage: {
    fontSize: fontSizeNative.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacingNative.sm,
  },
  errorCode: {
    fontSize: fontSizeNative.xs,
    color: colors.text.tertiary,
    marginBottom: spacingNative.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingNative.lg,
    paddingVertical: spacingNative.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.text.primary,
    fontSize: fontSizeNative.md,
    fontWeight: fontWeightNative.semibold,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingNative.xl,
  },
  successIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacingNative.md,
  },
  successIcon: {
    fontSize: 24,
    fontWeight: fontWeightNative.bold,
    color: colors.text.primary,
  },
  successTitle: {
    fontSize: fontSizeNative.lg,
    fontWeight: fontWeightNative.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacingNative.sm,
  },
  successMessage: {
    fontSize: fontSizeNative.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacingNative.lg,
  },
});
