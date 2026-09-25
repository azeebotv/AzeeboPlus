import { evaluateAmountLimits } from '../money';

describe('evaluateAmountLimits (H4 fund-flow validation)', () => {
  const MIN = 100;
  const MAX = 1_000_000;

  it('reports no violation for empty or unparseable input', () => {
    expect(evaluateAmountLimits('', MIN, MAX)).toEqual({
      value: null,
      isOverMax: false,
      isUnderMin: false,
    });
    // parseFloat is a lenient prefix parser: '1e' yields 1 (mid-edit of
    // something like '1e5'), while '.' yields NaN → null.
    expect(evaluateAmountLimits('1e', MIN, MAX).value).toBe(1);
    expect(evaluateAmountLimits('.', MIN, MAX).value).toBeNull();
  });

  it('flags values above the maximum without clamping them', () => {
    const result = evaluateAmountLimits('999999999', MIN, MAX);
    expect(result.value).toBe(999999999);
    expect(result.isOverMax).toBe(true);
    expect(result.isUnderMin).toBe(false);
  });

  it('flags positive values below the minimum', () => {
    const result = evaluateAmountLimits('50', MIN, MAX);
    expect(result.value).toBe(50);
    expect(result.isUnderMin).toBe(true);
    expect(result.isOverMax).toBe(false);
  });

  it('treats zero as "still typing", not a minimum violation', () => {
    const result = evaluateAmountLimits('0', MIN, MAX);
    expect(result.value).toBe(0);
    expect(result.isUnderMin).toBe(false);
    expect(result.isOverMax).toBe(false);
  });

  it('accepts exact boundary values', () => {
    expect(evaluateAmountLimits('100', MIN, MAX).isUnderMin).toBe(false);
    expect(evaluateAmountLimits('1000000', MIN, MAX).isOverMax).toBe(false);
  });

  it('accepts values inside the range', () => {
    const result = evaluateAmountLimits('5000', MIN, MAX);
    expect(result).toEqual({ value: 5000, isOverMax: false, isUnderMin: false });
  });
});
