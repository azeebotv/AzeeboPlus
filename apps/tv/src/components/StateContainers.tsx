import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, tvTypography, tvSpacing } from '../theme';
import { FocusableButton } from './Focusable';

export function LoadingState({ text }: { text?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

interface ErrorStateProps {
  description?: string;
  /** When provided, renders a D-pad-focusable Retry button (has preferred focus). */
  onRetry?: () => void;
}

export function ErrorState({ description, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorTitle}>{description || 'Something went wrong'}</Text>
      {onRetry ? (
        <FocusableButton
          title="Try again"
          variant="secondary"
          onPress={onRetry}
          hasTVPreferredFocus
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
}

export function EmptyState({ title, description }: { title?: string; description?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorTitle}>{title}</Text>
      {description ? <Text style={styles.text}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tvSpacing.xxl,
    gap: tvSpacing.lg,
  },
  text: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
    marginTop: tvSpacing.lg,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.bold,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 280,
  },
});
