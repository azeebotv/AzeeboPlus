import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ContentCard from './ContentCard';
import type { ContentItem } from '@azeebo/react-data';
const CARD_GAP = 12;
const SIDE_PADDING = 20;

interface ContentRowProps {
  title: string;
  subtitle?: string;
  sectionId: string;
  items: ContentItem[];
  isLoading?: boolean;
  progressMap?: Record<string, number>;
  showProgress?: boolean;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  cardSize?: 'sm' | 'md' | 'lg';
}

const CARD_WIDTHS = { sm: 120, md: 140, lg: 168 };

export default function ContentRow({
  title,
  subtitle,
  sectionId,
  items,
  isLoading = false,
  progressMap,
  showProgress = false,
  onLoadMore,
  hasMore = false,
  cardSize = 'md',
}: ContentRowProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollOffsetRef = useRef(0);

  const cardWidth = CARD_WIDTHS[cardSize];

  // Track scroll position for arrow visibility
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      setCanScrollLeft(contentOffset.x > 10);
      setCanScrollRight(contentOffset.x < contentSize.width - layoutMeasurement.width - 10);

      // Infinite scroll: trigger load more when near the end
      if (
        onLoadMore &&
        hasMore &&
        !isLoadingMore &&
        contentOffset.x > contentSize.width - layoutMeasurement.width - 200
      ) {
        setIsLoadingMore(true);
        onLoadMore().finally(() => setIsLoadingMore(false));
      }
    },
    [onLoadMore, hasMore, isLoadingMore]
  );

  const skeletons = Array.from({ length: 6 });

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.navButtons}>
          <Pressable
            style={[styles.navBtn, !canScrollLeft && styles.navBtnDisabled]}
            accessibilityLabel={`${title} ${t('home.scrollLeft')}`}
            accessibilityRole="button"
            onPress={() =>
              scrollRef.current?.scrollTo({ x: scrollOffsetRef.current - 300, animated: true })
            }
            disabled={!canScrollLeft}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={canScrollLeft ? colors.text.primary : 'rgba(255,255,255,0.3)'}
            />
          </Pressable>
          <Pressable
            style={[styles.navBtn, !canScrollRight && styles.navBtnDisabled]}
            accessibilityLabel={`${title} ${t('home.scrollRight')}`}
            accessibilityRole="button"
            onPress={() =>
              scrollRef.current?.scrollTo({ x: scrollOffsetRef.current + 300, animated: true })
            }
            disabled={!canScrollRight}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={canScrollRight ? colors.text.primary : 'rgba(255,255,255,0.3)'}
            />
          </Pressable>
        </View>
      </View>

      {/* Scrollable row */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel={`${title} ${t('home.contentList')}`}
      >
        {isLoading
          ? skeletons.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.skeleton,
                  {
                    width: cardWidth,
                    height: cardSize === 'sm' ? 168 : cardSize === 'lg' ? 236 : 196,
                  },
                ]}
              />
            ))
          : items.map((item, index) => (
              <ContentCard
                key={item.id}
                item={item}
                sectionId={sectionId}
                position={index}
                progress={progressMap?.[item.id]}
                showProgress={showProgress}
                size={cardSize}
              />
            ))}

        {/* Loading more indicator */}
        {isLoadingMore ? (
          <View style={styles.loadingMore}>
            <View style={styles.spinner} />
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SIDE_PADDING,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  scrollContent: {
    paddingHorizontal: SIDE_PADDING,
    gap: CARD_GAP,
  },
  skeleton: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  loadingMore: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: colors.primary[500],
  },
});
