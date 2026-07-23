# Analytics Event Definitions

> Standard event naming: `snake_case`
> Every conversion screen must fire: view, submit, success, failure

## Core Platform Events

| Event | Trigger | Properties |
|-------|---------|------------|
| user_registered | User completes registration | method, referral_code |
| user_logged_in | User logs in | method, device_type |
| user_logged_out | User logs out | — |
| user_profile_updated | User updates profile | fields_changed |
| wallet_funded | User funds wallet | amount, provider |
| wallet_withdrawal_requested | User requests withdrawal | amount |
| wallet_transfer_completed | Transfer completes | amount, recipient_id |
| payment_initialized | Payment starts | amount, provider, item_type |
| payment_verified | Payment verified | amount, provider, status |
| payment_failed | Payment fails | amount, provider, error |

## Reality Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| reality_show_viewed | User views show page | show_id |
| reality_episode_viewed | User views episode | show_id, episode_id |
| reality_vote_created | User casts vote | show_id, contestant_id, quantity, amount |
| reality_supervote_created | User casts supervote | show_id, contestant_id, quantity, amount |
| reality_prediction_submitted | User submits prediction | show_id, prediction |
| reality_leaderboard_viewed | User views leaderboard | show_id |

## Creator Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| creator_onboarded | Creator completes onboarding | category |
| creator_content_uploaded | Creator uploads content | content_type, universe |
| creator_tip_received | Creator receives tip | amount, from_user |
| creator_payout_requested | Creator requests payout | amount |
| creator_earnings_viewed | Creator views earnings | period |

## Lifestyle Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| lifestyle_feed_viewed | User views feed | — |
| lifestyle_event_rsvpd | User RSVPs to event | event_id |
| lifestyle_content_shared | User shares content | content_type, platform |
| lifestyle_challenge_joined | User joins challenge | challenge_id |

## Vertical Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| vertical_universe_viewed | User views universe | universe_slug |
| vertical_title_viewed | User views title | title_slug |
| vertical_character_viewed | User views character | character_slug |
| vertical_theory_submitted | User submits theory | storyworld_id |
| vertical_lore_explored | User explores lore | lore_id |

## Movie Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| movie_viewed | User views movie | movie_id |
| movie_rented | User rents movie | movie_id, amount |
| movie_added_watchlist | User adds to watchlist | movie_id |
| movie_rated | User rates movie | movie_id, rating |

## Games Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| game_started | User starts game | game_id, session_id |
| game_completed | User completes game | game_id, score, duration |
| game_answer_submitted | User submits answer | game_id, correct |
| game_daily_challenge_completed | User completes daily | score |
| game_tournament_joined | User joins tournament | tournament_id |

## Comedy Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| comedy_clip_viewed | User views clip | clip_id |
| comedy_clip_liked | User likes clip | clip_id |
| comedy_clip_shared | User shares clip | clip_id, platform |
| comedy_challenge_joined | User joins challenge | challenge_id |

## Sports Universe Events

| Event | Trigger | Properties |
|-------|---------|------------|
| sports_prediction_submitted | User submits prediction | fixture_id, prediction |
| sports_contest_entered | User enters contest | contest_id |
| sports_highlight_viewed | User views highlight | highlight_id |
| sports_fixture_viewed | User views fixture | fixture_id |
