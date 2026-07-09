import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

interface OfflineBannerProps {
  isOffline: boolean;
  queueLength?: number;
}

export function OfflineBanner({
  isOffline,
  queueLength = 0,
}: OfflineBannerProps): React.ReactElement | null {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, opacity]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>You're offline</Text>
          <Text style={styles.subtitle}>
            Showing cached content
            {queueLength > 0 && ` • ${queueLength} action${queueLength > 1 ? 's' : ''} pending`}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning[500],
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.text.primary,
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
});
