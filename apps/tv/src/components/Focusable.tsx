/**
 * D-pad navigation primitives for Android TV / Fire TV / tvOS.
 *
 * Built on TouchableOpacity — in RN 0.85 the TV focus props
 * (hasTVPreferredFocus, nextFocus*) are typed on the Touchable family, not
 * on Pressable. These primitives add:
 *  - consistent focus visual treatment (brand border + opacity shift)
 *  - `hasTVPreferredFocus` pass-through for initial focus placement
 *  - focus-gated callbacks (`onFocusChange`) for rails/rows to react
 *  - `nextFocusUp/Down/Left/Right` pass-through for explicit focus graphs
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
  StyleProp,
  NativeSyntheticEvent,
  TargetedEvent,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { colors, tvTypography, tvSpacing, tvRadius, focus } from '../theme';

type TVFocusEvent = NativeSyntheticEvent<TargetedEvent>;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/** Shared focus scale behavior (theme.focus documents it; this applies it). */
function useFocusScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = useCallback(
    (toValue: number) => {
      Animated.timing(scale, {
        toValue,
        duration: focus.transitionMs,
        useNativeDriver: true,
      }).start();
    },
    [scale]
  );
  const onFocus = useCallback(() => animateTo(focus.scale), [animateTo]);
  const onBlur = useCallback(() => animateTo(1), [animateTo]);
  return { scale, onFocus, onBlur };
}

// ── FocusableCard ─────────────────────────────────────────────

export interface FocusableCardProps {
  onPress: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Grab initial focus when the screen mounts. */
  hasTVPreferredFocus?: boolean;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  onFocusChange?: (isFocused: boolean) => void;
  testID?: string;
  accessibilityLabel?: string;
}

export function FocusableCard({
  onPress,
  children,
  style,
  hasTVPreferredFocus,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  onFocusChange,
  testID,
  accessibilityLabel,
}: FocusableCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { scale, onFocus: scaleUp, onBlur: scaleDown } = useFocusScale();

  const handleFocus = useCallback(
    (_evt: TVFocusEvent) => {
      // RN's TargetedEvent payload doesn't carry isFocused in 0.85 — a focus
      // event on this element means this element is focused.
      setIsFocused(true);
      scaleUp();
      onFocusChange?.(true);
    },
    [onFocusChange, scaleUp]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    scaleDown();
    onFocusChange?.(false);
  }, [onFocusChange, scaleDown]);

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      onPress={onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      hasTVPreferredFocus={hasTVPreferredFocus}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      style={[
        styles.card,
        !isFocused && { opacity: focus.unfocusedOpacity },
        isFocused && styles.cardFocused,
        { transform: [{ scale }] },
        style,
      ]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {children}
    </AnimatedTouchable>
  );
}

// ── FocusableButton ───────────────────────────────────────────

export interface FocusableButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  hasTVPreferredFocus?: boolean;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function FocusableButton({
  title,
  onPress,
  variant = 'primary',
  hasTVPreferredFocus,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  style,
  testID,
}: FocusableButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { scale, onFocus: scaleUp, onBlur: scaleDown } = useFocusScale();

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      onPress={onPress}
      onFocus={() => {
        setIsFocused(true);
        scaleUp();
      }}
      onBlur={() => {
        setIsFocused(false);
        scaleDown();
      }}
      hasTVPreferredFocus={hasTVPreferredFocus}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      style={[
        styles.button,
        styles[`button_${variant}`],
        isFocused && styles.buttonFocused,
        { transform: [{ scale }] },
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonTextGhost]}>
        {title}
      </Text>
    </AnimatedTouchable>
  );
}

// ── FocusableRow (horizontal rail) ────────────────────────────
// A horizontally-scrolling rail of FocusableCards. Stable focus tags give
// explicit nextFocusLeft/Right between siblings — RN's implicit focus search
// inside wrap-flex layouts is unreliable on TV.

export interface FocusableRowProps {
  title: string;
  items: RailItem[];
  onSelect: (item: RailItem) => void;
  /** Give the first card of this row initial focus. */
  hasTVPreferredFocus?: boolean;
}

export interface RailItem {
  id: string;
  title: string;
  thumbnail?: string;
  subtitle?: string;
}

let rowTagCounter = 1000;

export function FocusableRow({ title, items, onSelect, hasTVPreferredFocus }: FocusableRowProps) {
  // One tag BLOCK per row instance, sized to the row: siblings get base+index,
  // so the block must be at least items.length wide or the last cards' tags
  // run into the next row's base (duplicate tags make native focus resolution
  // ambiguous). Memoized on items.length so tags stay stable across re-renders
  // of the same row while a length change (new content) re-allocates cleanly.
  const rowTagBase = useMemo(() => {
    const base = rowTagCounter;
    rowTagCounter += Math.max(items.length, 1);
    return base;
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.rowTitle}>{title}</Text>
      {/* Horizontal scroll (10-foot rail convention): wrapping to a second
          row forced D-pad focus through every card, and vertical focus became
          ambiguous. TV rails scroll left/right like mobile's ContentRow. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowList}
      >
        {items.map((item, index) => (
          <FocusableCard
            key={item.id}
            onPress={() => onSelect(item)}
            hasTVPreferredFocus={hasTVPreferredFocus && index === 0}
            nextFocusLeft={index > 0 ? rowTagBase + index - 1 : undefined}
            nextFocusRight={index < items.length - 1 ? rowTagBase + index + 1 : undefined}
            style={styles.rowCard}
            accessibilityLabel={item.title}
          >
            <View style={styles.rowCardImage}>
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={150}
                  recyclingKey={item.id}
                />
              ) : (
                <View style={styles.rowCardImageFallback}>
                  <Text style={styles.rowCardImageFallbackText} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.rowCardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text style={styles.rowCardSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
          </FocusableCard>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: tvRadius.lg,
    overflow: 'hidden',
  },
  cardFocused: {
    borderWidth: focus.borderWidth,
    borderColor: focus.borderColor,
    opacity: 1,
  },
  button: {
    paddingVertical: tvSpacing.md,
    paddingHorizontal: tvSpacing.xxl,
    borderRadius: tvRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: focus.borderWidth,
    borderColor: 'transparent',
  },
  button_primary: {
    backgroundColor: colors.primary[500],
  },
  button_secondary: {
    backgroundColor: colors.bg.tertiary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border.default,
  },
  buttonFocused: {
    borderColor: focus.borderColor,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.md,
    fontWeight: tvTypography.fontWeight.semibold,
  },
  buttonTextGhost: {
    color: colors.text.primary,
  },
  rowContainer: {
    marginBottom: tvSpacing.xl,
  },
  rowTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.lg,
    fontWeight: tvTypography.fontWeight.bold,
    marginBottom: tvSpacing.md,
    marginLeft: tvSpacing.xxl,
  },
  rowList: {
    flexDirection: 'row',
    gap: tvSpacing.lg,
    paddingHorizontal: tvSpacing.xxl,
  },
  rowCard: {
    width: 320,
    backgroundColor: colors.bg.surface,
  },
  rowCardImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.bg.tertiary,
  },
  rowCardImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tvSpacing.sm,
  },
  rowCardImageFallbackText: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.sm,
  },
  rowCardTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.sm,
    fontWeight: tvTypography.fontWeight.semibold,
    padding: tvSpacing.sm,
  },
  rowCardSubtitle: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.xs,
    paddingHorizontal: tvSpacing.sm,
    paddingBottom: tvSpacing.sm,
  },
});
