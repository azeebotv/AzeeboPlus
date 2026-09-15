import {
  setPlaybackActive,
  hasActivePlayback,
  resetPlaybackActivityForTests,
} from '../playbackActivity';

describe('playbackActivity registry', () => {
  beforeEach(() => {
    resetPlaybackActivityForTests();
  });

  it('starts with no active playback', () => {
    expect(hasActivePlayback()).toBe(false);
  });

  it('reports active while a session is registered', () => {
    setPlaybackActive('content-1', true);
    expect(hasActivePlayback()).toBe(true);
  });

  it('reports inactive after the session deactivates', () => {
    setPlaybackActive('content-1', true);
    setPlaybackActive('content-1', false);
    expect(hasActivePlayback()).toBe(false);
  });

  it('stays active while any session is still playing (multi-screen / mini player)', () => {
    setPlaybackActive('tv-living-room', true);
    setPlaybackActive('mobile-mini', true);
    setPlaybackActive('tv-living-room', false);
    expect(hasActivePlayback()).toBe(true);

    setPlaybackActive('mobile-mini', false);
    expect(hasActivePlayback()).toBe(false);
  });

  it('deactivation of an unknown session is a safe no-op', () => {
    setPlaybackActive('never-started', false);
    expect(hasActivePlayback()).toBe(false);
  });

  it('re-activating the same session does not corrupt state', () => {
    setPlaybackActive('content-1', true);
    setPlaybackActive('content-1', true);
    setPlaybackActive('content-1', false);
    expect(hasActivePlayback()).toBe(false);
  });
});
