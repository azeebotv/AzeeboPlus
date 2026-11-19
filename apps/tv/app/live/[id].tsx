import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import { useTVVideoPlayer } from '../../src/hooks/useTVVideoPlayer';
import { FocusableButton } from '../../src/components/Focusable';
import { colors, tvTypography, tvSpacing, tvRadius } from '../../src/theme';

export default function TVLiveScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showOverlay] = useState(true);

  const { player } = useTVVideoPlayer({
    contentId: id || 'live-event',
    autoPlay: true,
  });

  return (
    <View style={styles.container}>
      {player ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}

      {/* ── 10-Foot Live Overlay ────────────────────────────── */}
      {showOverlay ? (
        <View style={styles.overlay}>
          <View style={styles.topRow}>
            <FocusableButton
              title="← Exit Live"
              variant="secondary"
              hasTVPreferredFocus
              onPress={() => router.back()}
            />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE BROADCAST</Text>
            </View>
          </View>

          <View style={styles.bottomInfo}>
            <Text style={styles.streamTitle}>Azeebo Live Event: {id}</Text>
            <Text style={styles.viewerCount}>🔴 14,280 Watching Now</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    padding: tvSpacing.xxl,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11,9,14,0.4)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 37, 28, 0.85)',
    paddingHorizontal: tvSpacing.md,
    paddingVertical: tvSpacing.xs,
    borderRadius: tvRadius.pill,
    gap: tvSpacing.xs,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text.primary,
  },
  liveText: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.sm,
    fontWeight: tvTypography.fontWeight.bold,
    letterSpacing: 1,
  },
  bottomInfo: {
    backgroundColor: 'rgba(11,9,14,0.7)',
    padding: tvSpacing.lg,
    borderRadius: tvRadius.md,
    maxWidth: 600,
  },
  streamTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.bold,
    marginBottom: tvSpacing.xs,
  },
  viewerCount: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
  },
});
