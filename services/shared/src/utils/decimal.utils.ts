import { Decimal } from '@prisma/client/runtime/library';

/**
 * Converts a Prisma Decimal or number to a JavaScript number.
 * Prisma returns Decimal types for monetary values, but we need regular numbers for API responses.
 * 
 * @param val - The Decimal or number value to convert
 * @returns The numeric value as a JavaScript number
 * 
 * @example
 * const balance = toNumber(wallet.balance); // Decimal -> number
 * const amount = toNumber(100); // number -> number (passthrough)
 */
export const toNumber = (val: Decimal | number): number => {
  return val instanceof Decimal ? val.toNumber() : val;
};

/**
 * Adds multiple Decimal or number values together, converting each to a number first.
 * Used for calculating total wallet balances across multiple balance types.
 * 
 * @param vals - Array of Decimal or number values to sum
 * @returns The sum of all values as a JavaScript number
 * 
 * @example
 * const total = addDecimals(wallet.mainBalance, wallet.bonusBalance, wallet.promoBalance);
 */
export const addDecimals = (...vals: (Decimal | number)[]): number => {
  return vals.reduce((acc: number, val: Decimal | number) => acc + toNumber(val), 0);
};

/**
 * Safely converts a potentially null/undefined Decimal to a number.
 * Returns 0 if the value is null or undefined.
 * 
 * @param val - The Decimal, number, null, or undefined value to convert
 * @returns The numeric value, or 0 if null/undefined
 * 
 * @example
 * const sum = safeDecimalToNumber(aggregation._sum.amount); // Handles null from Prisma aggregations
 */
export const safeDecimalToNumber = (val: Decimal | number | null | undefined): number => {
  if (val === null || val === undefined) {
    return 0;
  }
  return toNumber(val);
};
