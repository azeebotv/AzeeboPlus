#!/usr/bin/env bash
# =============================================================================
# Azeebo+ Demo Content Deploy — Per-Service Databases
# Splits the monolithic seed SQL and runs each section against the correct
# per-service database. Run after `./scripts/local-dev.sh setup`.
# Usage: ./deploy-local.sh [--skip-seed]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="$SCRIPT_DIR/migrations/002_seed_demo_data.sql"
PSQL="/Users/deprof/Library/FlyEnv/env/postgresql/bin/psql -U postgres"
SKIP_SEED=false

for arg in "$@"; do
  [[ "$arg" == "--skip-seed" ]] && SKIP_SEED=true
done

log()  { echo "[demo-seed] $*"; }
die()  { echo "[demo-seed] FATAL: $*" >&2; exit 1; }

[[ -f "$SEED_FILE" ]] || die "Seed file not found: $SEED_FILE"

# --- Helper: extract SQL between markers and run against a database ---
run_section() {
  local db="$1" label="$2" start_marker="$3" end_marker="$4"
  local sql
  sql=$(sed -n "/$start_marker/,/$end_marker/p" "$SEED_FILE")
  if [[ -n "$sql" ]]; then
    log "  Seeding $label → $db"
    $PSQL -d "$db" -c "$sql" 2>&1 | grep -v "^$" || true
  fi
}

# --- Helper: extract SQL between line numbers ---
run_lines() {
  local db="$1" label="$2" start="$3" end="$4"
  log "  Seeding $label → $db"
  sed -n "${start},${end}p" "$SEED_FILE" | $PSQL -d "$db" 2>&1 | grep -v "^$" || true
}

if [[ "$SKIP_SEED" == "false" ]]; then
  log "=== Deploying demo data to per-service databases ==="
  log ""

  # ==========================================================================
  # AUTH SERVICE (azeebo_auth)
  # ==========================================================================
  log "── azeebo_auth ──"
  run_lines azeebo_auth "Users" 44 69
  run_lines azeebo_auth "User Roles" 75 83
  # Roles, Permissions, Role Permissions (SECTION 28.8)
  run_lines azeebo_auth "Roles" 822 827
  run_lines azeebo_auth "Permissions" 829 834
  run_lines azeebo_auth "Role Permissions" 836 842
  log ""

  # ==========================================================================
  # USER SERVICE (azeebo_user)
  # ==========================================================================
  log "── azeebo_user ──"
  run_lines azeebo_user "User Profiles" 89 102
  run_lines azeebo_user "User Preferences" 108 119
  run_lines azeebo_user "Saved Items" 734 739
  run_lines azeebo_user "Following" 745 751
  run_lines azeebo_user "User Universe Affinity" 757 765
  run_lines azeebo_user "Subscriptions" 692 698
  run_lines azeebo_user "Audit Logs" 724 728
  # Watch History — seed file puts this in content but user-service owns it
  run_lines azeebo_user "Watch History" 664 686
  log ""

  # ==========================================================================
  # CONTENT SERVICE (azeebo_content)
  # ==========================================================================
  log "── azeebo_content ──"
  run_lines azeebo_content "System Settings" 14 35
  run_lines azeebo_content "Universes" 125 135
  run_lines azeebo_content "Categories" 141 150
  run_lines azeebo_content "Tags" 156 172
  run_lines azeebo_content "Content Items" 182 305
  run_lines azeebo_content "Content-Categories" 311 355
  run_lines azeebo_content "Content-Tags" 361 437
  run_lines azeebo_content "Media Assets" 443 527
  run_lines azeebo_content "Content Relationships" 533 543
  run_lines azeebo_content "Passes" 592 596
  run_lines azeebo_content "Rentals" 602 605
  run_lines azeebo_content "Screenings" 611 614
  run_lines azeebo_content "Locked Extras" 620 625
  run_lines azeebo_content "Comments" 631 658
  run_lines azeebo_content "Universe Feature Flags" 704 718
  log ""

  # ==========================================================================
  # WALLET SERVICE (azeebo_wallet)
  # ==========================================================================
  log "── azeebo_wallet ──"
  run_lines azeebo_wallet "Wallets" 549 562
  # Wallet Transactions section starts after wallets
  # Find the actual line range for wallet_transactions
  run_lines azeebo_wallet "Wallet Transactions" 564 586
  log ""

  # ==========================================================================
  # CREATOR SERVICE (azeebo_creator)
  # ==========================================================================
  log "── azeebo_creator ──"
  run_lines azeebo_creator "Creator Profiles" 771 775
  run_lines azeebo_creator "Creator Channels" 777 781
  run_lines azeebo_creator "Creator Earnings" 783 790
  run_lines azeebo_creator "Creator Challenges" 792 795
  run_lines azeebo_creator "Challenge Entries" 797 801
  run_lines azeebo_creator "Payout Requests" 803 806
  log ""

  # ==========================================================================
  # REALITY SERVICE (azeebo_reality)
  # ==========================================================================
  log "── azeebo_reality ──"
  run_lines azeebo_reality "Reality Shows" 917 921
  run_lines azeebo_reality "Reality Seasons" 923 927
  run_lines azeebo_reality "Reality Episodes" 929 936
  run_lines azeebo_reality "Reality Contestants" 938 947
  run_lines azeebo_reality "Reality Votes" 949 965
  run_lines azeebo_reality "Reality Supervotes" 967 971
  run_lines azeebo_reality "Reality Predictions" 973 979
  log ""

  # ==========================================================================
  # SPORTS SERVICE (azeebo_sports)
  # ==========================================================================
  log "── azeebo_sports ──"
  run_lines azeebo_sports "Sports Events" 985 990
  run_lines azeebo_sports "Event Teams" 992 999
  run_lines azeebo_sports "Prediction Markets" 1001 1004
  run_lines azeebo_sports "Prediction Entries" 1006 1011
  log ""

  # ==========================================================================
  # GAMES SERVICE (azeebo_games)
  # ==========================================================================
  log "── azeebo_games ──"
  run_lines azeebo_games "Games" 1017 1023
  run_lines azeebo_games "Game Questions" 1025 1041
  run_lines azeebo_games "Tournaments" 1043 1046
  run_lines azeebo_games "Tournament Entries" 1048 1053
  log ""

  # ==========================================================================
  # COMEDY SERVICE (azeebo_comedy)
  # ==========================================================================
  log "── azeebo_comedy ──"
  run_lines azeebo_comedy "Comedian Profiles" 1059 1062
  run_lines azeebo_comedy "Comedy Clips" 1064 1069
  log ""

  # ==========================================================================
  # ENGAGEMENT SERVICE (azeebo_engagement)
  # ==========================================================================
  log "── azeebo_engagement ──"
  run_lines azeebo_engagement "Leaderboard Entries" 1094 1103
  log ""

  # ==========================================================================
  # NOTIFICATION SERVICE (azeebo_notification)
  # ==========================================================================
  log "── azeebo_notification ──"
  run_lines azeebo_notification "Notification Preferences" 812 816
  run_lines azeebo_notification "Notification Templates" 848 851
  run_lines azeebo_notification "Campaigns" 853 855
  run_lines azeebo_notification "Notifications" 1075 1088
  log ""

  # ==========================================================================
  # REWARD SERVICE (azeebo_reward)
  # ==========================================================================
  log "── azeebo_reward ──"
  run_lines azeebo_reward "Levels" 866 870
  run_lines azeebo_reward "Badges" 872 875
  run_lines azeebo_reward "Reward Accounts" 877 880
  run_lines azeebo_reward "Points Ledger" 882 886
  log ""

  # ==========================================================================
  # REFERRAL SERVICE (azeebo_referral)
  # ==========================================================================
  log "── azeebo_referral ──"
  run_lines azeebo_referral "Referrals" 1109 1113
  log ""

  # ==========================================================================
  # MODERATION SERVICE (azeebo_moderation)
  # ==========================================================================
  log "── azeebo_moderation ──"
  run_lines azeebo_moderation "Moderation Queue" 1119 1123
  log ""

  # ==========================================================================
  # SUPPORT SERVICE (azeebo_support)
  # ==========================================================================
  log "── azeebo_support ──"
  run_lines azeebo_support "Support Tickets" 1125 1128
  log ""

  # ==========================================================================
  # SEARCH SERVICE (azeebo_search)
  # ==========================================================================
  log "── azeebo_search ──"
  run_lines azeebo_search "Search Query Logs" 892 898
  run_lines azeebo_search "User Searches" 900 903
  log ""

  # ==========================================================================
  # RECOMMENDATION SERVICE (azeebo_recommendation)
  # ==========================================================================
  log "── azeebo_recommendation ──"
  run_lines azeebo_recommendation "Product Events" 861 864
  log ""

  log "=== Demo data deployment complete ==="
else
  log "Skipping seed (--skip-seed)"
fi
