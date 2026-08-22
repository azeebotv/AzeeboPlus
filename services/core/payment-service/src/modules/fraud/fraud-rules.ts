export interface FraudRule { id: string; name: string; condition: string; action: 'block' | 'review' | 'flag'; severity: 'low' | 'medium' | 'high' | 'critical'; }
export const FRAUD_RULES: FraudRule[] = [
  { id: 'R001', name: 'High value transaction', condition: 'amount > 500000', action: 'review', severity: 'high' },
  { id: 'R002', name: 'Rapid transactions', condition: 'transactions_5min > 5', action: 'block', severity: 'critical' },
  { id: 'R003', name: 'New account high value', condition: 'account_age < 24h AND amount > 100000', action: 'review', severity: 'high' },
  { id: 'R004', name: 'Multiple failed attempts', condition: 'failed_attempts_1h > 3', action: 'block', severity: 'high' },
  { id: 'R005', name: 'Unusual location', condition: 'country != usual_country', action: 'flag', severity: 'medium' },
];
export function evaluateFraudRules(ctx: { amount: number; transactions5min: number; accountAgeHours: number; failedAttempts1h: number; country: string; usualCountry: string }): FraudRule[] {
  return FRAUD_RULES.filter(r => {
    if (r.id === 'R001') return ctx.amount > 500000;
    if (r.id === 'R002') return ctx.transactions5min > 5;
    if (r.id === 'R003') return ctx.accountAgeHours < 24 && ctx.amount > 100000;
    if (r.id === 'R004') return ctx.failedAttempts1h > 3;
    if (r.id === 'R005') return ctx.country !== ctx.usualCountry;
    return false;
  });
}
