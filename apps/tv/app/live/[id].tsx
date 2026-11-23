import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import { useTVVideoPlayer } from '../../src/hooks/useTVVideoPlayer';
import { FocusableButton } from '../../src/components/Focusable';
import { QRCodeView } from '../../src/components/QRCodeView';
import { colors, tvTypography, tvSpacing, tvRadius } from '../../src/theme';

export default function TVLiveScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showOverlay] = useState(true);
  const [fastVoted, setFastVoted] = useState(false);

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
        <View style={styles.overlay} pointerEvents="box-none">
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

          {/* ── Center / Right Live HUD Panel ── */}
          <View style={styles.hudContainer} pointerEvents="box-none">
            {/* ── Bottom Stream Info & 1-Click Remote Fast Vote ── */}
            <View style={styles.bottomInfo}>
              <Text style={styles.streamTitle}>Azeebo Live Stream: {id}</Text>
              <Text style={styles.viewerCount}>🔴 14,280 Watching Now</Text>
              <View style={styles.votePrompt}>
                <FocusableButton
                  title={fastVoted ? '✓ 50 Votes Cast!' : '⚡ Fast Vote (50 Coins)'}
                  variant={fastVoted ? 'secondary' : 'primary'}
                  onPress={() => setFastVoted(true)}
                />
              </View>
            </View>

            {/* ── Second-Screen Phone QR Overlay ── */}
            <View style={styles.qrHudBox}>
              <View style={styles.qrWhitePlate}>
                <QRCodeView value={`https://app.azeeboplus.com/live/${id}`} size={100} />
              </View>
              <Text style={styles.qrHudCaption}>Scan to Vote & Chat on Phone</Text>
            </View>
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
    backgroundColor: 'rgba(11,9,14,0.3)',
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
  hudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomInfo: {
    backgroundColor: 'rgba(11,9,14,0.85)',
    padding: tvSpacing.lg,
    borderRadius: tvRadius.md,
    maxWidth: 500,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    marginBottom: tvSpacing.md,
  },
  votePrompt: {
    alignSelf: 'flex-start',
  },
  qrHudBox: {
    backgroundColor: 'rgba(11,9,14,0.85)',
    padding: 12,
    borderRadius: tvRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  qrWhitePlate: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  qrHudCaption: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 120,
    textAlign: 'center',
  },
});
