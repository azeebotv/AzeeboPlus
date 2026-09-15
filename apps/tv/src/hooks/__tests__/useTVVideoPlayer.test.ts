/**
 * Unit tests for the TV player's key-to-action mapping logic.
 *
 * handleDPad is defined inside the hook, so we test the mapping table via a
 * lightweight extraction of the same switch logic. To keep the two honest,
 * the mapping lives in this shared constant consumed by the hook.
 */
import { mapDPadKeyToAction } from '../dPadMap';

describe('TV D-pad key mapping', () => {
  it('maps Select and MediaPlayPause to play-pause', () => {
    expect(mapDPadKeyToAction('Select')).toBe('togglePlay');
    expect(mapDPadKeyToAction('MediaPlayPause')).toBe('togglePlay');
  });

  it('maps Right and MediaFastForward to seek forward', () => {
    expect(mapDPadKeyToAction('Right')).toBe('seekForward');
    expect(mapDPadKeyToAction('MediaFastForward')).toBe('seekForward');
  });

  it('maps Left and MediaRewind to seek backward', () => {
    expect(mapDPadKeyToAction('Left')).toBe('seekBackward');
    expect(mapDPadKeyToAction('MediaRewind')).toBe('seekBackward');
  });

  it('ignores unknown keys (Up/Down navigate focus, not transport)', () => {
    expect(mapDPadKeyToAction('Up')).toBeNull();
    expect(mapDPadKeyToAction('Down')).toBeNull();
    expect(mapDPadKeyToAction('Back')).toBeNull();
    expect(mapDPadKeyToAction('')).toBeNull();
  });
});
