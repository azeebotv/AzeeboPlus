import { formatTime } from '../format';

describe('formatTime', () => {
  it('formats minutes:seconds below an hour', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(599)).toBe('9:59');
  });

  it('formats hours:minutes:seconds at and above an hour', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(7322)).toBe('2:02:02');
  });

  it('pads single-digit seconds and minutes', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(600)).toBe('10:00');
  });

  it('floors fractional seconds (player timeUpdates are fractional)', () => {
    expect(formatTime(59.98)).toBe('0:59');
    expect(formatTime(119.99)).toBe('1:59');
  });

  it('handles 0 and negative input without crashing', () => {
    expect(formatTime(-1)).toBe('0:00');
  });
});
