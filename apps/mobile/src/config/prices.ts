/**
 * Centralized price configuration for the Azeebo+ mobile app.
 *
 * TODO: Migrate these to API calls to the payment-service/content-service.
 * Prices should be fetched server-side and cached, never hardcoded.
 * See CLAUDE.md: "Never hardcode prices in frontend or backend code."
 */

export const CURRENCY = '₦';

export const moviePricing = {
  rent48h: { id: 'rent-48h', type: 'Rent (48h)', price: 500, label: '₦500' },
  buy: { id: 'buy', type: 'Buy', price: 1500, label: '₦1,500' },
  pass: { id: 'pass', type: 'Pass', price: 4500, label: '₦4,500/mo' },
} as const;

export const moviePassPrice = { monthly: 4500, label: '₦4,500/month' } as const;

export const rentPrice = 500;

export const votePackages = {
  standard: [
    { id: '1', votes: 10, price: 100, bonus: 0, label: '10 Votes' },
    { id: '2', votes: 50, price: 450, bonus: 5, label: '50 Votes + 5 Bonus' },
    { id: '3', votes: 100, price: 850, bonus: 15, label: '100 Votes + 15 Bonus' },
    { id: '4', votes: 500, price: 4000, bonus: 100, label: '500 Votes + 100 Bonus' },
  ],
  reality: [
    { id: '1', votes: 100, price: 100, bonus: 0 },
    { id: '2', votes: 500, price: 450, bonus: 50 },
    { id: '3', votes: 1000, price: 850, bonus: 150 },
    { id: '4', votes: 5000, price: 4000, bonus: 1000 },
  ],
  superVote: [
    { id: 'pkg1', name: 'Single Vote', votes: 1, price: 100, description: '1 Super Vote (2x weight)' },
    { id: 'pkg2', name: 'Power Pack', votes: 5, price: 450, description: '5 Super Votes (2x weight each)', isPopular: true },
    { id: 'pkg3', name: 'Ultimate Pack', votes: 10, price: 800, description: '10 Super Votes (2x weight each)' },
    { id: 'pkg4', name: 'Mega Pack', votes: 25, price: 1800, description: '25 Super Votes (2x weight each)' },
  ],
} as const;

export const verticalSubscription = { monthly: 2000, label: '₦2,000/month' } as const;

export const comedySubscription = { monthly: 1500, label: '₦1,500/month' } as const;

export const cityGuidePricing = {
  premium: 5000,
  standard: 3000,
} as const;

export const walletPresetAmounts = [500, 1000, 2500, 5000, 10000] as const;

export const paymentPresetAmounts = [500, 1000, 2500, 5000, 10000] as const;

export const addFundsPresetAmounts = [500, 1000, 2000, 5000, 10000, 20000] as const;

export const walletLimits = {
  minimumWithdrawal: 500,
  minimumDeposit: 100,
  maximumDeposit: 1000000,
} as const;
