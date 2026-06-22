import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';

interface StateComponentProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  icon?: string;
  accessibilityLabel?: string;
}

export function LoadingState({ title = 'Loading...', accessibilityLabel }: StateComponentProps) {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={accessibilityLabel || 'Loading'}
    >
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

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
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  premiumButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
});
