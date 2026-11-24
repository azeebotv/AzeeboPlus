import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '@azeebo/design-tokens';

interface StateComponentProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  icon?: string;
  accessibilityLabel?: string;
}

/** Displays a loading spinner with an optional title. */
export function LoadingState({ title = 'Loading...', accessibilityLabel }: StateComponentProps) {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={accessibilityLabel || 'Loading'}
    >
      <ActivityIndicator size="large" color={colors.primary[500]} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

/** Displays an empty state with an icon, title, and description when no data is available. */
export function EmptyState({
  title = 'No content found',
  description = "There's nothing to show here yet",
  icon = '📭',
  accessibilityLabel,
}: StateComponentProps) {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={accessibilityLabel || 'Empty state'}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

/** Displays an error message with a retry button. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again later',
  buttonText = 'Retry',
  onButtonPress,
  accessibilityLabel,
}: StateComponentProps) {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={accessibilityLabel || 'Error state'}
    >
      <Text style={styles.icon}>❌</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onButtonPress && (
        <TouchableOpacity
          style={styles.button}
          onPress={onButtonPress}
          accessible={true}
          accessibilityLabel={buttonText}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Displays a success confirmation with a continue button. */
export function SuccessState({
  title = 'Success!',
  description = 'Your action was completed successfully',
  buttonText = 'Continue',
  onButtonPress,
}: StateComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Displays a network unavailable state with a retry button. */
export function NoInternetState({
  title = 'No Internet Connection',
  description = 'Please check your network and try again',
  buttonText = 'Retry',
  onButtonPress,
}: StateComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📶</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Displays a payment failure state with a retry button. */
export function PaymentFailureState({
  title = 'Payment Failed',
  description = 'Your payment could not be processed',
  buttonText = 'Try Again',
  onButtonPress,
}: StateComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💳</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Displays a content unavailable state for removed or locked content. */
export function ContentUnavailableState({
  title = 'Content Unavailable',
  description = 'This content is no longer available',
  buttonText = 'Browse More',
  onButtonPress,
}: StateComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Displays a moderation-removed notice when content violates guidelines. */
export function ModerationRemovedState({
  title = 'Content Removed',
  description = 'This content has been removed due to community guidelines',
}: StateComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚫</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

/** Displays a premium content lock screen with an upgrade button. */
export function LockedPremiumState({
  title = 'Premium Content',
  description = 'Upgrade to premium to access this content',
  buttonText = 'Go Premium',
  onButtonPress,
}: StateComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⭐</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onButtonPress && (
        <TouchableOpacity style={styles.premiumButton} onPress={onButtonPress}>
          <Text style={styles.premiumButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Displays a welcome/onboarding state for first-time users. */
export function FirstTimeState({
  title = 'Welcome!',
  description = 'Get started by exploring our content',
  buttonText = 'Explore',
  onButtonPress,
}: StateComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>👋</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.dark[200],
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  buttonText: {
    color: colors.light[50],
    fontSize: 16,
    fontWeight: '600',
  },
  premiumButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  premiumButtonText: {
    color: colors.dark[700],
    fontSize: 16,
    fontWeight: '700',
  },
});
