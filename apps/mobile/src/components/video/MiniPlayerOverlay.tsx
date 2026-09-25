/**
 * PiP-style mini player overlay — a draggable video card that keeps playback
 * alive while the user browses other screens.
 *
 * Behavior:
 *  - Rendered by the root layout above the navigator, so it floats over
 *    every screen.
 *  - Drag with a finger; on release it snaps to the nearest horizontal edge
 *    at a comfortable vertical position.
 *  - Tap → expand (navigate to the owner screen, which re-claims the shared
 *    player full-surface). Play/pause + close buttons; close pauses and
 *    dismisses.
 *  - The provider pauses playback when a screen minimizes or blurs; this
 *    overlay's play button resumes (YouTube-style explicit opt-in).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { VideoView } from 'expo-video';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedVideoPlayer } from '../../contexts/VideoPlayerContext';

const CARD_WIDTH = 160;
const VIDEO_HEIGHT = 90; // 16:9
const CARD_HEIGHT = VIDEO_HEIGHT + 22;
const MARGIN = 12;

export function MiniPlayerOverlay(): React.JSX.Element | null {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { player, active, miniVisible, dismissMini } = useSharedVideoPlayer();

  const [isPlaying, setIsPlaying] = useState(player.playing);
  useEffect(() => {
    const sub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    return () => sub.remove();
  }, [player]);

  // Animated card position, mirrored in a plain ref so gesture math and
  // spring targets read synchronously without poking private fields.
  const position = useRef(
    new Animated.ValueXY({ x: windowWidth - CARD_WIDTH - MARGIN, y: 140 })
  ).current;
  const posRef = useRef({
    x: windowWidth - CARD_WIDTH - MARGIN,
    y: 140,
  });
  const dragStart = useRef({ x: 0, y: 0 });

  const clamp = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const maxX = Math.max(windowWidth - CARD_WIDTH - MARGIN, MARGIN);
      const maxY = Math.max(windowHeight - CARD_HEIGHT - MARGIN * 5, MARGIN);
      return {
        x: Math.min(Math.max(x, MARGIN), maxX),
        y: Math.min(Math.max(y, MARGIN), maxY),
      };
    },
    [windowWidth, windowHeight]
  );

  // Tap-vs-drag split: the pan fails on <6px movement, so plain taps fall
  // through to the RN touchables inside the card (surface → expand, ✕ →
  // close, ▶ → play/pause) while a real drag cancels them and moves the card.
  const drag = Gesture.Pan()
    .minDistance(6)
    .onBegin(() => {
      dragStart.current = { ...posRef.current };
    })
    .onUpdate((event) => {
      const next = clamp(
        dragStart.current.x + event.translationX,
        dragStart.current.y + event.translationY
      );
      posRef.current = next;
      position.setValue(next);
    })
    .onEnd((event) => {
      // Snap to the nearest horizontal edge, flinging in the swipe direction
      // when the velocity is decisive.
      const center = posRef.current.x + CARD_WIDTH / 2;
      const snapLeft =
        Math.abs(event.velocityX) > 400 ? event.velocityX < 0 : center < windowWidth / 2;
      const target = {
        x: snapLeft ? MARGIN : windowWidth - CARD_WIDTH - MARGIN,
        y: posRef.current.y,
      };
      posRef.current = target;
      Animated.spring(position, {
        toValue: target,
        useNativeDriver: false,
        friction: 8,
      }).start();
    });

  const handleExpand = useCallback(() => {
    if (!active) return;
    dismissMini();
    router.push(active.ownerPath as Href);
  }, [active, dismissMini, router]);

  const handleClose = useCallback(() => {
    player.pause();
    dismissMini();
  }, [player, dismissMini]);

  if (!miniVisible || !active) return null;

  return (
    <GestureDetector gesture={drag}>
      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateX: position.x }, { translateY: position.y }] },
        ]}
      >
        <TouchableOpacity style={styles.surfaceButton} onPress={handleExpand} activeOpacity={0.9}>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            contentFit="cover"
            nativeControls={false}
          />
        </TouchableOpacity>

        <View style={styles.sideControls} pointerEvents="box-none">
          <TouchableOpacity onPress={handleClose} style={styles.controlButton}>
            <Text style={styles.controlIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (isPlaying ? player.pause() : player.play())}
            style={styles.controlButton}
          >
            <Text style={styles.controlIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.titleBar} onPress={handleExpand}>
          <Text style={styles.titleText} numberOfLines={1}>
            {active.title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  surfaceButton: {
    width: CARD_WIDTH,
    height: VIDEO_HEIGHT,
  },
  sideControls: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
  },
  controlButton: {
    width: 26,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  controlIcon: {
    color: '#fff',
    fontSize: 12,
  },
  titleBar: {
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  titleText: {
    color: '#fff',
    fontSize: 11,
  },
});
