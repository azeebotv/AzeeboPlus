/**
 * D-pad / media-key → transport action mapping for the TV player.
 *
 * Extracted from useTVVideoPlayer so unit tests exercise the same table the
 * hook consumes (no duplicated switch to drift). Key names follow React
 * Native's Keyboard events on Android TV / tvOS ("Select", "Right", …).
 */
export type DPadAction = 'togglePlay' | 'seekForward' | 'seekBackward';

export function mapDPadKeyToAction(key: string): DPadAction | null {
  switch (key) {
    case 'Select':
    case 'MediaPlayPause':
      return 'togglePlay';
    case 'Right':
    case 'MediaFastForward':
      return 'seekForward';
    case 'Left':
    case 'MediaRewind':
      return 'seekBackward';
    default:
      // Up/Down navigate focus between rows; Back exits the player. Unknown
      // keys must not touch transport state.
      return null;
  }
}
