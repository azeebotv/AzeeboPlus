/**
 * Centralized price configuration for the Azeebo+ TV app.
 *
 * Moved to the shared data layer (@azeebo/react-data) so mobile and TV
 * cannot drift. Re-exported here for backward compatibility with existing
 * import sites; prefer importing from '@azeebo/react-data' in new code.
 */

export {
  CURRENCY,
  getMoviePricing,
  getVotePackages,
  getWalletPricing,
  getPassesPricing,
  clearPricingCache,
  votePackages,
  moviePricing,
  moviePassPrice,
  rentPrice,
  paymentPresetAmounts,
  addFundsPresetAmounts,
  walletPresetAmounts,
  walletLimits,
  comedySubscription,
} from '@azeebo/react-data/config/prices';
