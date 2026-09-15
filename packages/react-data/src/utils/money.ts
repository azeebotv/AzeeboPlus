/**
 * Money/amount validation helpers shared by the fund flows (mobile AmountInput
 * today, TV fund screen if it grows a custom-amount path).
 *
 * Pure and platform-free so jest can pin the H4 behavior: violations are
 * *reported*, never silently clamped — fighting the numeric keypad mid-edit
 * is hostile; the UI shows the violation live and blocks on submit instead.
 */

export interface AmountLimitEvaluation {
  /** Parsed numeric value; null when the input is not (yet) a number. */
  value: number | null;
  /** Value exceeds the maximum allowed deposit. */
  isOverMax: boolean;
  /** Value is a positive number below the minimum allowed deposit. */
  isUnderMin: boolean;
}

export function evaluateAmountLimits(
  rawValue: string,
  minimumAmount: number,
  maximumAmount: number
): AmountLimitEvaluation {
  const parsed = parseFloat(rawValue);
  const value = Number.isNaN(parsed) ? null : parsed;
  return {
    value,
    isOverMax: value !== null && value > maximumAmount,
    // Empty/partial input ("", "0", "1e") must not nag about the minimum.
    isUnderMin: value !== null && value > 0 && value < minimumAmount,
  };
}
