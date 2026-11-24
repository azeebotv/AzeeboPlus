/**
 * Player settings sheet for the watch screen — quality, playback speed and
 * autoplay-next, persisted via usePlayerPreferences.
 *
 * Presented as a bottom sheet (RN Modal, slide-up) so it feels native on
 * both platforms; choices apply instantly (the caller owns the player) and
 * persist across sessions.
 */
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch } from 'react-native';
import {
  PLAYBACK_SPEEDS,
  QUALITY_OPTIONS,
  type PlaybackSpeed,
  type QualityPreference,
  type PlayerPreferences,
} from '../../hooks/usePlayerPreferences';
import { colors } from '../../theme';

interface PlayerSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  preferences: PlayerPreferences;
  onQualityChange: (quality: QualityPreference) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onAutoplayNextChange: (enabled: boolean) => void;
}

function SectionTitle({ children }: { children: string }): React.JSX.Element {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function OptionRow({
  label,
  selected,
  badge,
  onSelect,
}: {
  label: string;
  selected: boolean;
  badge?: string;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onSelect} activeOpacity={0.7}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      {badge ? <Text style={styles.optionBadge}>{badge}</Text> : null}
      {selected ? <Text style={styles.checkMark}>✓</Text> : null}
    </TouchableOpacity>
  );
}

export function PlayerSettingsSheet({
  visible,
  onClose,
  preferences,
  onQualityChange,
  onSpeedChange,
  onAutoplayNextChange,
}: PlayerSettingsSheetProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} accessible={false}>
          <View />
        </TouchableOpacity>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <SectionTitle>Quality</SectionTitle>
          {QUALITY_OPTIONS.map((option) => (
            <OptionRow
              key={option}
              label={option === 'auto' ? 'Auto (recommended)' : option}
              selected={preferences.quality === option}
              badge={
                option !== 'auto' && preferences.quality !== option ? 'coming soon' : undefined
              }
              onSelect={() => onQualityChange(option)}
            />
          ))}

          <SectionTitle>Playback speed</SectionTitle>
          {PLAYBACK_SPEEDS.map((speed) => (
            <OptionRow
              key={speed}
              label={speed === 1 ? 'Normal' : `${speed}×`}
              selected={preferences.playbackSpeed === speed}
              onSelect={() => onSpeedChange(speed)}
            />
          ))}

          <View style={styles.autoplayRow}>
            <View style={styles.autoplayText}>
              <Text style={styles.autoplayTitle}>Autoplay next</Text>
              <Text style={styles.autoplaySubtitle}>Play the next video automatically</Text>
            </View>
            <Switch
              value={preferences.autoplayNext}
              onValueChange={onAutoplayNextChange}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.primary[500] }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.bg.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 14,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
  optionBadge: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginRight: 8,
  },
  checkMark: {
    color: colors.primary[500],
    fontSize: 18,
    fontWeight: '700',
  },
  autoplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  autoplayText: {
    flex: 1,
    gap: 2,
  },
  autoplayTitle: {
    color: '#fff',
    fontSize: 16,
  },
  autoplaySubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
});
