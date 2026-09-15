import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/theme';
import { formatTime } from '@azeebo/react-data';
import type { ContentItem } from '@azeebo/react-data';

const CARD_SIZES = {
  sm: { width: 120, height: 168 },
  md: { width: 140, height: 196 },
  lg: { width: 168, height: 236 },
} as const;

interface ContentCardProps {
  item: ContentItem;
  sectionId: string;
  position: number;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ContentCard({
  item,
  sectionId: _sectionId,
  position,
  progress,
  showProgress = false,
  size = 'md',
}: ContentCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    router.push(`/watch/${item.id}`);
  }, [router, item.id]);

  const { width, height } = CARD_SIZES[size];
  const thumbnailSrc =
    item.mediaAsset?.thumbnailUrl ||
    item.thumbnail ||
    'https://placehold.co/400x560/0D3B2E/FFF?text=Azeebo%2B';

  // Duration badge uses the shared formatter; hide the badge entirely when
  // duration is unknown (0/negative) instead of rendering "0:00".
  const durationLabel = item.duration && item.duration > 0 ? formatTime(item.duration) : null;

  return (
    <Animated.View entering={FadeInDown.delay(position * 60).springify()}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.card, { width, height }]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityLabel={`${t('content.watch')} ${item.title}`}
          accessibilityRole="button"
        >
          <Image source={{ uri: thumbnailSrc }} style={styles.thumbnail} resizeMode="cover" />

          {/* Duration badge */}
          {durationLabel ? (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{durationLabel}</Text>
            </View>
          ) : null}

          {/* Universe badge */}
          {item.universe?.icon ? (
            <View style={styles.universeBadge}>
              <Text style={styles.universeText}>{item.universe.icon}</Text>
            </View>
          ) : null}

          {/* Progress bar */}
          {showProgress && typeof progress === 'number' && progress > 0 ? (
            <View
              style={styles.progressBarContainer}
              accessibilityLabel={`${Math.round(progress * 100)}% ${t('content.watched')}`}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(progress * 100),
              }}
            >
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(progress * 100)}%` as unknown as number },
                ]}
              />
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {item.creator?.name ? (
            <Text style={styles.creator} numberOfLines={1}>
              {item.creator.name}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  universeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  universeText: {
    fontSize: 12,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  titleContainer: {
    paddingHorizontal: 2,
    marginTop: 6,
  },
  title: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  creator: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
});
