/**
 * YouTube-style gestures for the mobile video surface.
 *
 *  - Double-tap left half  → seek back 10s; right half → seek forward 10s.
 *    Rapid taps stack (up to 3 chevrons) like YouTube's "2×" indicator.
 *  - Vertical drag on the LEFT edge  → app brightness (expo-brightness).
 *  - Vertical drag on the RIGHT edge → player volume (expo-video).
 *    Both show a vertical-fill HUD that fades out after the drag ends.
 *  - Single tap → reported via onSingleTap (the screen toggles controls).
 *
 * All gestures live in ONE GestureDetector on a full-surface layer so they
 * can never fight each other geometrically: taps are recognized as taps,
 * drags activate only on ≥10px vertical movement (fail on ≥20px horizontal,
 * which leaves room for a future horizontal scrub gesture). Child controls
 * stay touchable because the screen renders them as a `pointerEvents="box-none"`
 * sibling ABOVE this layer, not as children.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Brightness from 'expo-brightness';
import * as Haptics from 'expo-haptics';
import type { VideoPlayer } from 'expo-video';

const SEEK_SECONDS = 10;
const EDGE_FRACTION = 0.35; // left/right fraction of width treated as an edge zone
const HUD_VISIBLE_MS = 800;
const MAX_CHEVRONS = 3;

type HudKind = 'brightness' | 'volume';

interface SeekIndicator {
  side: 'left' | 'right';
  chevrons: number;
  key: number; // re-triggers the fade animation per tap
}

interface VideoGestureLayerProps {
  player: VideoPlayer;
  /** Single tap on the surface (controls toggle is owned by the screen). */
  onSingleTap: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function VideoGestureLayer({
  player,
  onSingleTap,
  onSeekBack,
  onSeekForward,
  children,
  style,
}: VideoGestureLayerProps): React.JSX.Element {
  const [size, setSize] = useState({ width: 0, height: 0 });

  // ── Seek ripple ───────────────────────────────────────────────
  const [seekIndicator, setSeekIndicator] = useState<SeekIndicator | null>(null);
  const seekFade = useRef(new Animated.Value(0)).current;
  const chevronCount = useRef(1);
  const chevronResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekKey = useRef(0);

  const showSeekIndicator = useCallback(
    (side: 'left' | 'right') => {
      if (chevronResetTimer.current) {
        clearTimeout(chevronResetTimer.current);
      }
      chevronCount.current = Math.min(chevronCount.current + 1, MAX_CHEVRONS);
      seekKey.current += 1;
      setSeekIndicator({ side, chevrons: chevronCount.current, key: seekKey.current });

      seekFade.setValue(0);
      Animated.timing(seekFade, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(seekFade, {
          toValue: 0,
          duration: 500,
          delay: 300,
          useNativeDriver: true,
        }).start();
      });

      // A pause longer than YouTube's indicator window resets the stack.
      chevronResetTimer.current = setTimeout(() => {
        chevronCount.current = 0;
      }, 1000);
    },
    [seekFade]
  );

  useEffect(() => {
    return () => {
      if (chevronResetTimer.current) {
        clearTimeout(chevronResetTimer.current);
      }
    };
  }, []);

  const handleDoubleTap = useCallback(
    (tapX: number) => {
      const isLeft = tapX < size.width / 2;
      if (isLeft) {
        onSeekBack();
        showSeekIndicator('left');
      } else {
        onSeekForward();
        showSeekIndicator('right');
      }
    },
    [size.width, onSeekBack, onSeekForward, showSeekIndicator]
  );

  // ── Brightness / volume HUD + edge drag state ─────────────────
  const [hud, setHud] = useState<{ kind: HudKind; value: number } | null>(null);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragSide = useRef<'left' | 'right' | null>(null);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);
  const lastHapticStep = useRef(0);
  const brightnessReady = useRef(false);
  const initialBrightness = useRef<number | null>(null);

  const flashHud = useCallback((kind: HudKind, value: number) => {
    setHud({ kind, value: Math.min(Math.max(value, 0), 1) });
    if (hudTimer.current) {
      clearTimeout(hudTimer.current);
    }
    hudTimer.current = setTimeout(() => setHud(null), HUD_VISIBLE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (hudTimer.current) {
        clearTimeout(hudTimer.current);
      }
      // Leave the device at the brightness the user had before the gesture,
      // not wherever the last drag ended.
      const original = initialBrightness.current;
      if (original !== null) {
        Brightness.setBrightnessAsync(original).catch(() => {});
      }
    };
  }, []);

  const ensureBrightnessBaseline = useCallback(async () => {
    if (brightnessReady.current) return;
    try {
      if (!(await Brightness.isAvailableAsync())) return;
      const current = await Brightness.getBrightnessAsync();
      initialBrightness.current = current;
      brightnessReady.current = true;
    } catch {
      // Permission denied / unsupported — the left edge just does nothing.
    }
  }, []);

  const hapticTick = useCallback((value: number) => {
    const step = Math.floor(value * 10);
    if (step !== lastHapticStep.current) {
      lastHapticStep.current = step;
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
    .onBegin((event) => {
      dragSide.current = event.x < size.width * EDGE_FRACTION ? 'left' : 'right';
      dragStartY.current = event.y;
      lastHapticStep.current = -1;
      if (dragSide.current === 'right') {
        dragStartValue.current = player.volume;
      } else {
        void ensureBrightnessBaseline();
      }
    })
    .onUpdate((event) => {
      if (!dragSide.current || size.height <= 0) return;
      const delta = (dragStartY.current - event.y) / size.height; // up = increase
      if (dragSide.current === 'right') {
        const volume = Math.min(Math.max(dragStartValue.current + delta, 0), 1);
        player.volume = volume;
        hapticTick(volume);
        flashHud('volume', volume);
      } else if (brightnessReady.current) {
        const base = initialBrightness.current ?? 0.5;
        const brightness = Math.min(Math.max(base + delta, 0.05), 1);
        void Brightness.setBrightnessAsync(brightness).catch(() => {});
        hapticTick(brightness);
        flashHud('brightness', brightness);
      }
    })
    .onFinalize(() => {
      dragSide.current = null;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      handleDoubleTap(event.x);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => {
      onSingleTap();
    });

  // Single tap must only fire when the double tap has definitively failed.
  const tapGesture = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <GestureDetector gesture={Gesture.Simultaneous(tapGesture, pan)}>
      <View style={[styles.surface, style]} onLayout={(e) => setSize(e.nativeEvent.layout)}>
        {children}

        {/* Double-tap seek ripple */}
        {seekIndicator ? (
          <Animated.View
            key={seekIndicator.key}
            pointerEvents="none"
            style={[
              styles.seekRipple,
              seekIndicator.side === 'left' ? styles.seekRippleLeft : styles.seekRippleRight,
              { opacity: seekFade },
            ]}
          >
            <Text style={styles.seekRippleText}>
              {seekIndicator.side === 'left' ? '«' : '»'}
              {' ›'.repeat(seekIndicator.chevrons - 1)}
            </Text>
            <Text style={styles.seekRippleSeconds}>
              {seekIndicator.side === 'left' ? '-' : '+'}
              {SEEK_SECONDS * seekIndicator.chevrons}s
            </Text>
          </Animated.View>
        ) : null}

        {/* Brightness / volume HUD */}
        {hud ? (
          <View
            pointerEvents="none"
            style={[styles.hud, hud.kind === 'brightness' ? styles.hudLeft : styles.hudRight]}
          >
            <Text style={styles.hudIcon}>
              {hud.kind === 'brightness' ? '☀️' : hud.value === 0 ? '🔇' : '🔊'}
            </Text>
            <View style={styles.hudTrack}>
              <View style={[styles.hudFill, { height: `${hud.value * 100}%` }]} />
            </View>
            <Text style={styles.hudValue}>{Math.round(hud.value * 100)}%</Text>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
  seekRipple: {
    position: 'absolute',
    top: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  seekRippleLeft: {
    left: '8%',
  },
  seekRippleRight: {
    right: '8%',
  },
  seekRippleText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
  },
  seekRippleSeconds: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  hud: {
    position: 'absolute',
    top: '25%',
    alignItems: 'center',
    gap: 8,
    width: 56,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  hudLeft: {
    left: '6%',
  },
  hudRight: {
    right: '6%',
  },
  hudIcon: {
    fontSize: 20,
  },
  hudTrack: {
    width: 6,
    height: 120,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  hudFill: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  hudValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
