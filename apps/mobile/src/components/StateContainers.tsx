import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@azeebo/design-tokens';

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
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <View
    style={styles.container}
    accessibilityRole="none"
    accessibilityLabel={`Empty state: ${title}. ${description}`}
  >
    <Text style={styles.icon} accessibilityElementsHidden>
      {icon}
    </Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'Please try again later',
  onRetry,
}) => (
  <View
    style={styles.container}
    accessibilityRole="alert"
    accessibilityLabel={`Error: ${title}. ${description}`}
  >
    <Text style={styles.icon} accessibilityElementsHidden>
      ❌
    </Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    <TouchableOpacity
      style={styles.retryButton}
      onPress={onRetry}
      accessibilityRole="button"
      accessibilityLabel={`Retry: ${title}`}
      accessibilityHint="Tapping this button will attempt to load the content again"
    >
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
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
    accessibilityRole="status"
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
        accessibilityHint={`Tapping this button will ${actionText.toLowerCase()}`}
      >
        <Text style={styles.retryButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.bg.primary,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    minHeight: 48,
    minWidth: 120,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {
  LoadingState,
  EmptyState,
  ErrorState,
  SuccessState,
};
