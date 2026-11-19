import { Analytics, ConsentCategory } from '@azeebo/analytics-sdk';
import Constants from 'expo-constants';
import { logger } from '@azeebo/react-data/utils/logger';

const constantsExtra = (
  (Constants as Record<string, unknown>).expoConfig as Record<string, unknown>
)?.extra as Record<string, unknown> | undefined;
const analyticsEndpoint =
  (constantsExtra?.analyticsEndpoint as string) || process.env.EXPO_PUBLIC_ANALYTICS_ENDPOINT || '';

const sdk = new Analytics({
  enabled: !!analyticsEndpoint && process.env.NODE_ENV !== 'test',
  debug: __DEV__,
  endpoint: analyticsEndpoint || undefined,
  flushBatchSize: 5,
  flushInterval: 15000,
  defaultConsent: {
    [ConsentCategory.ESSENTIAL]: true,
    [ConsentCategory.ANALYTICS]: true,
  },
});

class AnalyticsService {
  private track(name: string, properties?: Record<string, unknown>): void {
    try {
      sdk.track({ name, properties, category: ConsentCategory.ANALYTICS });
    } catch (err: unknown) {
      if (__DEV__)
        logger.warn('[Analytics] track failed:', err instanceof Error ? err.message : String(err));
    }
  }

  // --- Reality Universe ---
  realityShowViewed(showId: string) {
    this.track('reality_show_viewed', { show_id: showId });
  }

  realityEpisodeViewed(showId: string, episodeId: string) {
    this.track('reality_episode_viewed', { show_id: showId, episode_id: episodeId });
  }

  realityVoteCreated(showId: string, contestantId: string, quantity: number, amount: number) {
    this.track('reality_vote_created', {
      show_id: showId,
      contestant_id: contestantId,
      quantity,
      amount,
    });
  }

  realitySupervoteCreated(showId: string, contestantId: string, quantity: number, amount: number) {
    this.track('reality_supervote_created', {
      show_id: showId,
      contestant_id: contestantId,
      quantity,
      amount,
    });
  }

  realityPredictionSubmitted(showId: string, prediction: string) {
    this.track('reality_prediction_submitted', { show_id: showId, prediction });
  }

  realityLeaderboardViewed(showId: string) {
    this.track('reality_leaderboard_viewed', { show_id: showId });
  }

  // --- Creator Universe ---
  creatorOnboarded(category: string) {
    this.track('creator_onboarded', { category });
  }

  creatorContentUploaded(contentType: string, universe: string) {
    this.track('creator_content_uploaded', { content_type: contentType, universe });
  }

  creatorTipReceived(amount: number, fromUser: string) {
    this.track('creator_tip_received', { amount, from_user: fromUser });
  }

  creatorPayoutRequested(amount: number) {
    this.track('creator_payout_requested', { amount });
  }

  creatorEarningsViewed(period: string) {
    this.track('creator_earnings_viewed', { period });
  }

  // --- Lifestyle Universe ---
  lifestyleFeedViewed() {
    this.track('lifestyle_feed_viewed');
  }

  lifestyleEventRsvpd(eventId: string) {
    this.track('lifestyle_event_rsvpd', { event_id: eventId });
  }

  lifestyleContentShared(contentType: string, platform: string) {
    this.track('lifestyle_content_shared', { content_type: contentType, platform });
  }

  lifestyleChallengeJoined(challengeId: string) {
    this.track('lifestyle_challenge_joined', { challenge_id: challengeId });
  }

  // --- Vertical Universe ---
  verticalUniverseViewed(universeSlug: string) {
    this.track('vertical_universe_viewed', { universe_slug: universeSlug });
  }

  verticalTitleViewed(titleSlug: string) {
    this.track('vertical_title_viewed', { title_slug: titleSlug });
  }

  verticalCharacterViewed(characterSlug: string) {
    this.track('vertical_character_viewed', { character_slug: characterSlug });
  }

  verticalTheorySubmitted(storyworldId: string) {
    this.track('vertical_theory_submitted', { storyworld_id: storyworldId });
  }

  verticalLoreExplored(loreId: string) {
    this.track('vertical_lore_explored', { lore_id: loreId });
  }

  // --- Movie Universe ---
  movieViewed(movieId: string) {
    this.track('movie_viewed', { movie_id: movieId });
  }

  movieRented(movieId: string, amount: number) {
    this.track('movie_rented', { movie_id: movieId, amount });
  }

  movieAddedWatchlist(movieId: string) {
    this.track('movie_added_watchlist', { movie_id: movieId });
  }

  movieRated(movieId: string, rating: number) {
    this.track('movie_rated', { movie_id: movieId, rating });
  }

  // --- Games Universe ---
  gameStarted(gameId: string, sessionId: string) {
    this.track('game_started', { game_id: gameId, session_id: sessionId });
  }

  gameCompleted(gameId: string, score: number, duration: number) {
    this.track('game_completed', { game_id: gameId, score, duration });
  }

  gameAnswerSubmitted(gameId: string, correct: boolean) {
    this.track('game_answer_submitted', { game_id: gameId, correct });
  }

  gameDailyChallengeCompleted(score: number) {
    this.track('game_daily_challenge_completed', { score });
  }

  gameTournamentJoined(tournamentId: string) {
    this.track('game_tournament_joined', { tournament_id: tournamentId });
  }

  // --- Comedy Universe ---
  comedyClipViewed(clipId: string) {
    this.track('comedy_clip_viewed', { clip_id: clipId });
  }

  comedyClipLiked(clipId: string) {
    this.track('comedy_clip_liked', { clip_id: clipId });
  }

  comedyClipShared(clipId: string, platform: string) {
    this.track('comedy_clip_shared', { clip_id: clipId, platform });
  }

  comedyChallengeJoined(challengeId: string) {
    this.track('comedy_challenge_joined', { challenge_id: challengeId });
  }

  // --- Sports Universe ---
  sportsPredictionSubmitted(fixtureId: string, prediction: string) {
    this.track('sports_prediction_submitted', { fixture_id: fixtureId, prediction });
  }

  sportsContestEntered(contestId: string) {
    this.track('sports_contest_entered', { contest_id: contestId });
  }

  sportsHighlightViewed(highlightId: string) {
    this.track('sports_highlight_viewed', { highlight_id: highlightId });
  }

  sportsFixtureViewed(fixtureId: string) {
    this.track('sports_fixture_viewed', { fixture_id: fixtureId });
  }

  // --- Core Platform ---
  userRegistered(method: string, referralCode?: string) {
    this.track('user_registered', { method, referral_code: referralCode });
  }

  userLoggedIn(method: string, deviceType: string) {
    this.track('user_logged_in', { method, device_type: deviceType });
  }

  walletFunded(amount: number, provider: string) {
    this.track('wallet_funded', { amount, provider });
  }

  paymentInitialized(amount: number, provider: string, itemType: string) {
    this.track('payment_initialized', { amount, provider, item_type: itemType });
  }

  paymentVerified(amount: number, provider: string, status: string) {
    this.track('payment_verified', { amount, provider, status });
  }

  paymentFailed(amount: number, provider: string, error: string) {
    this.track('payment_failed', { amount, provider, error });
  }

  // --- 20 Canonical Revenue-Path Events (PMR Task 06.2 / R-11 / G-07) ---
  authCompleted(method: string, userId?: string, referralCode?: string) {
    this.track('auth_completed', { method, user_id: userId, referral_code: referralCode });
  }

  subscriptionStarted(planId: string, planName: string, amount: number, billingCycle?: string) {
    this.track('subscription_started', {
      plan_id: planId,
      plan_name: planName,
      amount,
      billing_cycle: billingCycle || 'monthly',
    });
  }

  subscriptionRenewed(planId: string, planName: string, amount: number) {
    this.track('subscription_renewed', { plan_id: planId, plan_name: planName, amount });
  }

  subscriptionCancelled(planId: string, planName: string, reason?: string) {
    this.track('subscription_cancelled', { plan_id: planId, plan_name: planName, reason });
  }

  voteSubmitted(showId: string, contestantId: string, votes: number, amount: number) {
    this.track('vote_submitted', {
      show_id: showId,
      contestant_id: contestantId,
      votes,
      amount,
    });
  }

  supervoteSubmitted(showId: string, contestantId: string, votes: number, amount: number) {
    this.track('supervote_submitted', {
      show_id: showId,
      contestant_id: contestantId,
      votes,
      amount,
    });
  }

  ppvTicketPurchased(ticketId: string, eventId: string, amount: number) {
    this.track('ppv_ticket_purchased', { ticket_id: ticketId, event_id: eventId, amount });
  }

  cinemaPassPurchased(passId: string, passName: string, amount: number) {
    this.track('cinema_pass_purchased', { pass_id: passId, pass_name: passName, amount });
  }

  creatorTipped(creatorId: string, amount: number, tier?: string) {
    this.track('creator_tipped', { creator_id: creatorId, amount, tier });
  }

  merchandiseCheckoutStarted(cartId: string, itemCount: number, totalAmount: number) {
    this.track('merchandise_checkout_started', {
      cart_id: cartId,
      item_count: itemCount,
      total_amount: totalAmount,
    });
  }

  merchandisePurchased(orderId: string, totalAmount: number, items: Array<{ id: string; price: number }>) {
    this.track('merchandise_purchased', {
      order_id: orderId,
      total_amount: totalAmount,
      items,
    });
  }

  predictionStaked(
    predictionId: string,
    universe: string,
    stakeAmount: number,
    potentialWin: number
  ) {
    this.track('prediction_staked', {
      prediction_id: predictionId,
      universe,
      stake_amount: stakeAmount,
      potential_win: potentialWin,
    });
  }

  predictionWon(predictionId: string, winAmount: number) {
    this.track('prediction_won', { prediction_id: predictionId, win_amount: winAmount });
  }

  predictionLost(predictionId: string, lostAmount: number) {
    this.track('prediction_lost', { prediction_id: predictionId, lost_amount: lostAmount });
  }

  videoPlaybackStarted(
    contentId: string,
    title?: string,
    universe?: string,
    isPremium?: boolean
  ) {
    this.track('video_playback_started', {
      content_id: contentId,
      title,
      universe,
      is_premium: isPremium,
    });
  }

  videoPlaybackCompleted(contentId: string, watchDuration: number, totalDuration?: number) {
    this.track('video_playback_completed', {
      content_id: contentId,
      watch_duration: watchDuration,
      total_duration: totalDuration,
    });
  }

  checkoutAbandoned(itemType: string, itemId: string, amount: number, step?: string) {
    this.track('checkout_abandoned', {
      item_type: itemType,
      item_id: itemId,
      amount,
      step,
    });
  }

  checkoutFailed(itemType: string, itemId: string, amount: number, error: string) {
    this.track('checkout_failed', {
      item_type: itemType,
      item_id: itemId,
      amount,
      error,
    });
  }

  screenViewed(screenName: string, properties?: Record<string, unknown>) {
    this.track('screen_viewed', { screen_name: screenName, ...properties });
  }

  setUser(userId: string) {
    sdk.setUser({ userId });
  }

  clearUser() {
    sdk.clearUser();
  }

  flush() {
    sdk.flush();
  }
}

export const analytics = new AnalyticsService();
export default analytics;
