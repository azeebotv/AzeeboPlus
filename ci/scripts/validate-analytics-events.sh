#!/bin/bash

# Analytics Event Validation Script
# Validates that all analytics events follow the naming convention:
# - snake_case format
# - Universe prefix (e.g., reality_, creator_, lifestyle_)
# - Descriptive action (e.g., viewed, clicked, submitted)
#
# Per CLAUDE.md analytics rules:
#   Good: reality_vote_submitted, creator_content_uploaded
#   Bad:  RealityVoteSubmitted (wrong case), vote (missing prefix), userDidVote (wrong format)

echo "🔍 Running analytics event validation..."

# Exit on first error
set -e

# Track if any issues were found
HAS_ERRORS=0

# --------------------------
# Valid universe prefixes
# --------------------------
VALID_PREFIXES="reality|creator|lifestyle|vertical|movie|games|comedy|sports|user|wallet|payment|content|search|media|notification|reward|referral|messaging|engagement|subscription|moderation|queue|support|analytics|recommendation|auth|screen|play|share|login|signup|vote|prediction|game|reward"

# --------------------------
# Find all analytics event names in the codebase
# --------------------------
echo ""
echo "📡 Scanning for analytics event names..."

# Pattern 1: track({ name: 'event_name' })
# Pattern 2: name: 'event_name'
# Pattern 3: .track('event_name',
# Pattern 4: analytics.track({ name: 'event_name' })

# Collect all event names from .track() calls and analytics event definitions
EVENT_NAMES=$(grep -r -h -E "name:\s*['\"][a-z_]+['\"]" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.git \
  . \
  | sed -E "s/.*name:\s*['\"]([a-z_]+)['\"].*/\1/" \
  | sort -u)

if [ -z "$EVENT_NAMES" ]; then
  echo "ℹ️  No analytics event names found"
  exit 0
fi

echo "Found $(echo "$EVENT_NAMES" | wc -l | tr -d ' ') unique event names to validate"
echo ""

# --------------------------
# Validation 1: Check snake_case format
# --------------------------
echo "📝 Checking snake_case format..."

SNAKE_CASE_ERRORS=0
while IFS= read -r event; do
  # Skip empty lines
  [ -z "$event" ] && continue

  # Check for camelCase or PascalCase (uppercase letters)
  if echo "$event" | grep -qE "[A-Z]"; then
    echo "  ❌ '$event' contains uppercase letters (should be snake_case)"
    SNAKE_CASE_ERRORS=$((SNAKE_CASE_ERRORS + 1))
  fi

  # Check for hyphens (should be underscores)
  if echo "$event" | grep -q "-"; then
    echo "  ❌ '$event' contains hyphens (should use underscores)"
    SNAKE_CASE_ERRORS=$((SNAKE_CASE_ERRORS + 1))
  fi

  # Check for spaces
  if echo "$event" | grep -q " "; then
    echo "  ❌ '$event' contains spaces"
    SNAKE_CASE_ERRORS=$((SNAKE_CASE_ERRORS + 1))
  fi
done <<< "$EVENT_NAMES"

if [ $SNAKE_CASE_ERRORS -gt 0 ]; then
  echo "❌ Found $SNAKE_CASE_ERRORS snake_case format violations"
  HAS_ERRORS=1
else
  echo "✅ All event names use snake_case format"
fi

# --------------------------
# Validation 2: Check for universe prefix
# --------------------------
echo ""
echo "🏷️  Checking for universe prefix..."

# Generic event names that are allowed without a universe prefix
# (these are platform-level events defined in the analytics SDK)
ALLOWED_GENERIC_EVENTS="screen_view|content_impression|content_click|login_success|login_failed|signup_completed|signup_failed|payment_success|payment_failed|payment_initiated|reward_earned|reward_redeemed|creator_follow|creator_followed|creator_tip_sent|creator_tipped|prediction_placed|game_started|game_completed|share|share_initiated|notification_received|notification_clicked|notification_opened|play_start|play_complete|vote_submitted|vote_initiated"

PREFIX_ERRORS=0
while IFS= read -r event; do
  [ -z "$event" ] && continue

  # Skip allowed generic events
  if echo "$ALLOWED_GENERIC_EVENTS" | grep -qw "$event"; then
    continue
  fi

  # Check if event starts with a valid universe prefix
  HAS_VALID_PREFIX=0
  IFS='|' read -ra PREFIX_ARRAY <<< "$VALID_PREFIXES"
  for prefix in "${PREFIX_ARRAY[@]}"; do
    if echo "$event" | grep -qE "^${prefix}_"; then
      HAS_VALID_PREFIX=1
      break
    fi
  done

  if [ $HAS_VALID_PREFIX -eq 0 ]; then
    echo "  ❌ '$event' missing universe prefix (expected one of: reality_, creator_, lifestyle_, etc.)"
    PREFIX_ERRORS=$((PREFIX_ERRORS + 1))
  fi
done <<< "$EVENT_NAMES"

if [ $PREFIX_ERRORS -gt 0 ]; then
  echo "❌ Found $PREFIX_ERRORS events missing universe prefix"
  HAS_ERRORS=1
else
  echo "✅ All event names have appropriate prefixes"
fi

# --------------------------
# Validation 3: Check for descriptive action
# --------------------------
echo ""
echo "🎯 Checking for descriptive action verbs..."

# Valid action verbs (past or present tense)
VALID_ACTIONS="view|viewed|click|clicked|submit|submitted|start|started|complete|completed|initiate|initiated|success|failed|earn|earned|redeem|redeemed|follow|followed|tip|tipped|place|placed|share|shared|receive|received|open|opened|impression|rsvp|upload|uploaded|create|created|update|updated|delete|deleted|register|registered|login|logout|signup|signout|verify|verified|reset|confirm|cancel|approve|reject|publish|draft|schedule|play|pause|stop|resume|seek|buffer|error|warn|info|debug"

ACTION_ERRORS=0
while IFS= read -r event; do
  [ -z "$event" ] && continue

  # Skip allowed generic events
  if echo "$ALLOWED_GENERIC_EVENTS" | grep -qw "$event"; then
    continue
  fi

  # Extract the action part (last segment after the last underscore)
  ACTION=$(echo "$event" | awk -F'_' '{print $NF}')

  # Check if the action is in the valid actions list
  if ! echo "$VALID_ACTIONS" | grep -qw "$ACTION"; then
    echo "  ⚠️  '$event' has action '$ACTION' which is not in the standard action list"
    echo "      Consider using a standard action verb: viewed, clicked, submitted, started, completed, etc."
    ACTION_ERRORS=$((ACTION_ERRORS + 1))
  fi
done <<< "$EVENT_NAMES"

if [ $ACTION_ERRORS -gt 0 ]; then
  echo "⚠️  Found $ACTION_ERRORS events with non-standard action verbs (warnings only)"
  # Don't set HAS_ERRORS for action verb warnings - these are suggestions
else
  echo "✅ All event names use descriptive action verbs"
fi

# --------------------------
# Validation 4: Check for reserved/sensitive data in event properties
# --------------------------
echo ""
echo "🔒 Checking for sensitive data in event properties..."

SENSITIVE_PATTERNS="password|passwd|pwd|token|secret|api_key|apikey|credit_card|card_number|cvv|ssn|national_id"

SENSITIVE_ISSUES=$(grep -r -i -E "$SENSITIVE_PATTERNS" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.git \
  packages/analytics-sdk \
  apps/mobile/src/services \
  apps/mobile/src/hooks \
  apps/web/src/services \
  apps/web/src/hooks \
  2>/dev/null \
  | grep -i "properties\|track\|event" \
  | wc -l)

if [ $SENSITIVE_ISSUES -gt 0 ]; then
  echo "❌ Found $SENSITIVE_ISSUES potential sensitive data references in analytics code"
  grep -r -i -E "$SENSITIVE_PATTERNS" \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.git \
    packages/analytics-sdk \
    apps/mobile/src/services \
    apps/mobile/src/hooks \
    apps/web/src/services \
    apps/web/src/hooks \
    2>/dev/null \
    | grep -i "properties\|track\|event" \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No sensitive data references found in analytics code"
fi

# --------------------------
# Validation 5: Check that analytics SDK is used (not custom tracking)
# --------------------------
echo ""
echo "📦 Checking for custom analytics implementations (should use SDK)..."

CUSTOM_TRACKING=$(grep -r -E "(fetch|axios)\(['\"].*analytics['\"]" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.git \
  --exclude-dir=packages/analytics-sdk \
  apps \
  services \
  2>/dev/null \
  | grep -v "analytics-sdk" \
  | wc -l)

if [ $CUSTOM_TRACKING -gt 0 ]; then
  echo "❌ Found $CUSTOM_TRACKING custom analytics calls (should use @azeebo/analytics-sdk)"
  grep -r -E "(fetch|axios)\(['\"].*analytics['\"]" \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.git \
    --exclude-dir=packages/analytics-sdk \
    apps \
    services \
    2>/dev/null \
    | grep -v "analytics-sdk" \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No custom analytics implementations found"
fi

# --------------------------
# Summary
# --------------------------
echo ""
echo "========================================"
echo "Analytics Event Validation Summary:"
echo "  - Snake case format: $([ $SNAKE_CASE_ERRORS -eq 0 ] && echo "PASS" || echo "FAIL")"
echo "  - Universe prefix:   $([ $PREFIX_ERRORS -eq 0 ] && echo "PASS" || echo "FAIL")"
echo "  - Action verbs:      $([ $ACTION_ERRORS -eq 0 ] && echo "PASS" || echo "WARN")"
echo "  - Sensitive data:    $([ $SENSITIVE_ISSUES -eq 0 ] && echo "PASS" || echo "FAIL")"
echo "  - SDK usage:         $([ $CUSTOM_TRACKING -eq 0 ] && echo "PASS" || echo "FAIL")"
echo "========================================"

if [ $HAS_ERRORS -eq 1 ]; then
  echo "❌ Analytics validation completed with errors"
  exit 1
else
  echo "✅ All analytics validations passed"
  exit 0
fi
