import { isLowDataMode, shouldAutoPlay, getImageQuality, getImageSize } from '../low-data';

const flagOn = (key: string): boolean => key === 'web_autoplay' || key === 'web_low_data_default';
const flagOff = (): boolean => false;

describe('shouldAutoPlay (web_autoplay gate)', () => {
  const originalConnection = Object.getOwnPropertyDescriptor(
    navigator,
    'connection'
  );

  afterEach(() => {
    window.localStorage.clear();
    if (originalConnection) {
      Object.defineProperty(navigator, 'connection', originalConnection);
    }
  });

  it('returns true when web_autoplay is on and no low-data signals', () => {
    window.localStorage.setItem('lowDataMode', 'false');
    expect(shouldAutoPlay(flagOn)).toBe(true);
  });

  it('returns false when web_autoplay is off regardless of preference', () => {
    window.localStorage.setItem('lowDataMode', 'false');
    expect(shouldAutoPlay(flagOff)).toBe(false);
    expect(shouldAutoPlay()).toBe(true); // no flags arg => flag not consulted
  });

  it('returns false in low-data mode even when web_autoplay is on', () => {
    window.localStorage.setItem('lowDataMode', 'true');
    expect(shouldAutoPlay(flagOn)).toBe(false);
  });

  it('does not crash without localStorage (SSR-like)', () => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => null;
    expect(typeof shouldAutoPlay(flagOn)).toBe('boolean');
    Storage.prototype.getItem = getItem;
  });
});

describe('isLowDataMode (web_low_data_default gate)', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('defaults to low-data when the flag is on and no preference is stored', () => {
    expect(isLowDataMode(flagOn)).toBe(true);
  });

  it('respects an explicit opt-out over the flag', () => {
    window.localStorage.setItem('lowDataMode', 'false');
    expect(isLowDataMode(flagOn)).toBe(false);
  });

  it('returns false when the flag is off and no preference is stored', () => {
    expect(isLowDataMode(flagOff)).toBe(false);
    expect(isLowDataMode()).toBe(false);
  });
});

describe('quality/size helpers', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('reduces quality when low-data default flag is on', () => {
    expect(getImageQuality(80, flagOn)).toBe(40);
    expect(getImageSize(1000, flagOn)).toBe(500);
  });

  it('keeps normal quality when the flag is off', () => {
    expect(getImageQuality(80, flagOff)).toBe(80);
    expect(getImageSize(1000, flagOff)).toBe(1000);
  });
});
