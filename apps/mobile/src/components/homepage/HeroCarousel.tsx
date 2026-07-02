import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ContentItem } from '@/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroCarouselProps {
  slides: ContentItem[];
  autoRotateIntervalMs?: number;
}

export default function HeroCarousel({ slides, autoRotateIntervalMs = 6000 }: HeroCarouselProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % slides.length) + slides.length) % slides.length;
      setCurrentIndex(next);
    },
    [slides.length]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(goNext, autoRotateIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goNext, slides.length, autoRotateIntervalMs]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  const handleSlidePress = () => {
    router.push(`/watch/${currentSlide.id}`);
  };

  return (
    <View
      style={styles.container}
      accessibilityLabel={t('home.featuredContent')}
      accessibilityRole="adjustable"
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
    >
      <Animated.View
        key={currentSlide.id}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={StyleSheet.absoluteFill}
      >
        <Image
          source={{
            uri:
              currentSlide.mediaAsset?.thumbnailUrl ||
              currentSlide.thumbnail ||
              'https://placehold.co/800x600/0D3B2E/FFF?text=Azeebo%2B',
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Gradient overlays */}
      <LinearGradient
        colors={['rgba(13,59,46,0.95)', 'rgba(13,59,46,0.6)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(13,59,46,0.9)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <Pressable style={styles.content} onPress={handleSlidePress}>
        {/* Universe badge */}
        {currentSlide.universe?.name ? (
          <View style={styles.universeBadge}>
            <Text style={styles.universeBadgeText}>
              {currentSlide.universe.icon} {currentSlide.universe.name}
            </Text>
          </View>
        ) : null}

        <Text style={styles.title} numberOfLines={2}>
          {currentSlide.title}
        </Text>

        {currentSlide.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {currentSlide.description}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.watchButton} onPress={handleSlidePress}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.watchButtonText}>{t('home.watchNow')}</Text>
          </Pressable>
          {currentSlide.duration ? (
            <Text style={styles.duration}>
              {Math.floor(currentSlide.duration / 60)} {t('content.min')}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/* Navigation arrows */}
      <Pressable
        style={[styles.navButton, styles.navPrev]}
        onPress={goPrev}
        accessibilityLabel={t('home.previousSlide')}
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>
      <Pressable
        style={[styles.navButton, styles.navNext]}
        onPress={goNext}
        accessibilityLabel={t('home.nextSlide')}
        accessibilityRole="button"
      >
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </Pressable>

      {/* Indicator dots */}
      <View style={styles.indicators}>
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            style={[styles.indicator, index === currentIndex && styles.indicatorActive]}
            accessibilityLabel={`${t('home.slide')} ${index + 1}: ${slide.title}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: Math.min(Dimensions.get('window').height * 0.55, 420),
    overflow: 'hidden',
    backgroundColor: '#0D3B2E',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  universeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,66,10,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  universeBadgeText: {
    color: '#E8420A',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8420A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  duration: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navPrev: { left: 12 },
  navNext: { right: 12 },
  indicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    backgroundColor: '#E8420A',
    width: 12,
    height: 8,
    borderRadius: 4,
  },
});
