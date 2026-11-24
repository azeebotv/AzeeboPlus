#!/bin/bash
# Pre-commit hook: detect ACTUAL hardcoded secrets in staged files
# Install: cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# This hook catches REAL secrets (actual random strings), not:
# - Env var references: $VAR, ${VAR}, ${VAR:-default}
# - Placeholder values: <set-via-secrets-manager>, your-xxx-here
# - Command substitutions: $(openssl rand ...)

set -euo pipefail

# Ensure standard and user binary paths are available (Git hooks often run with a minimal PATH)
for p in \
  "/opt/homebrew/bin" \
  "/opt/homebrew/sbin" \
  "/usr/local/bin" \
  "/usr/local/sbin" \
  "$HOME/.local/bin" \
  "$HOME/Library/FlyEnv/env/node/bin" \
  "$HOME/Library/FlyEnv/alias" \
  "$HOME/Library/pnpm" \
  "$HOME/.local/share/pnpm" \
  "$HOME/.pnpm"; do
  if [ -d "$p" ] && [[ ":$PATH:" != *":$p:"* ]]; then
    export PATH="$p:$PATH"
  fi
done

# Check NVM / FNM / Volta if node or pnpm are still not in PATH
if ! command -v pnpm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1090
    \. "$NVM_DIR/nvm.sh" 2>/dev/null || true
  elif [ -d "$HOME/.fnm/current/bin" ]; then
    export PATH="$HOME/.fnm/current/bin:$PATH"
  elif [ -d "$HOME/.volta/bin" ]; then
    export PATH="$HOME/.volta/bin:$PATH"
  fi
fi

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Files to always skip
SKIP_FILES=(
  '.env.example'
  '*.env.example'
  'pnpm-lock.yaml'
  'package-lock.json'
  '*.md'
  'scripts/pre-commit-hook.sh'
  'scripts/__tests__/pre-commit-secrets.test.mjs'
)

echo "Checking for secrets in staged files..."

FOUND=0

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$STAGED_FILES" ]; then
  echo "No staged files to check."
  exit 0
fi

for FILE in $STAGED_FILES; do
  # Skip non-text files (but keep PEM/cert files — they can contain private keys)
  FILE_TYPE=$(file "$FILE" 2>/dev/null || true)
  if ! echo "$FILE_TYPE" | grep -qiE 'text|PEM|certificate'; then
    continue
  fi

  # Skip known-safe files
  SKIP=false
  for SKIP_PATTERN in "${SKIP_FILES[@]}"; do
    if [[ "$FILE" == $SKIP_PATTERN ]]; then
      SKIP=true
      break
    fi
  done
  if $SKIP; then
    continue
  fi

  # Check for actual hardcoded secrets (not env var references)
  # Pattern: SECRET_NAME=<actual-value> where value doesn't contain $, ${, $(, or <
  while IFS= read -r line; do
    # Skip comments
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    # Skip lines with env var references
    [[ "$line" =~ \$\{ ]] && continue
    [[ "$line" =~ \$[A-Z_] ]] && continue
    [[ "$line" =~ \$\( ]] && continue
    # Skip lines with placeholders
    [[ "$line" =~ \<[a-z] ]] && continue
    [[ "$line" =~ your-.*-here ]] && continue
    [[ "$line" =~ change-this ]] && continue
    # Check CI test secret allowlist (.github/ci-test-secret-allowlist)
    if [[ -f ".github/ci-test-secret-allowlist" ]]; then
      while IFS= read -r allowlist_pattern; do
        # Skip comments and blank lines
        [[ "$allowlist_pattern" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$allowlist_pattern" ]] && continue
        if echo "$line" | grep -qiE "$allowlist_pattern"; then
          continue 2  # skip outer while loop — value is allowlisted
        fi
      done < .github/ci-test-secret-allowlist
    fi

    # Check for real secrets
    if echo "$line" | grep -qiE 'JWT_ACCESS_SECRET=[A-Za-z0-9+/=_-]{20,}'; then
      echo -e "${RED}Hardcoded JWT_ACCESS_SECRET found in:${NC} $FILE"
      FOUND=1
    elif echo "$line" | grep -qiE 'JWT_REFRESH_SECRET=[A-Za-z0-9+/=_-]{20,}'; then
      echo -e "${RED}Hardcoded JWT_REFRESH_SECRET found in:${NC} $FILE"
      FOUND=1
    elif echo "$line" | grep -qiE 'GATEWAY_SECRET=[A-Za-z0-9+/=_-]{20,}'; then
      echo -e "${RED}Hardcoded GATEWAY_SECRET found in:${NC} $FILE"
      FOUND=1
    elif echo "$line" | grep -qiE 'PAYSTACK_SECRET_KEY=sk_[a-zA-Z0-9_]{20,}'; then
      echo -e "${RED}Hardcoded PAYSTACK_SECRET_KEY found in:${NC} $FILE"
      FOUND=1
    elif echo "$line" | grep -qiE 'FLUTTERWAVE_SECRET_KEY=FLWSECK-[a-zA-Z0-9]{20,}'; then
      echo -e "${RED}Hardcoded FLUTTERWAVE_SECRET_KEY found in:${NC} $FILE"
      FOUND=1
    elif echo "$line" | grep -qiE 'TWILIO_AUTH_TOKEN=[a-f0-9]{32}'; then
      echo -e "${RED}Hardcoded TWILIO_AUTH_TOKEN found in:${NC} $FILE"
      FOUND=1
    elif echo "$line" | grep -qiE -e 'BEGIN.*PRIVATE KEY'; then
      echo -e "${RED}Private key found in:${NC} $FILE"
      FOUND=1
    fi
  done < <(grep -iE -e 'JWT_ACCESS_SECRET=' -e 'JWT_REFRESH_SECRET=' -e 'GATEWAY_SECRET=' -e 'PAYSTACK_SECRET_KEY=' -e 'FLUTTERWAVE_SECRET_KEY=' -e 'TWILIO_AUTH_TOKEN=' -e 'PRIVATE_KEY=' -e 'BEGIN.*PRIVATE KEY' "$FILE" 2>/dev/null || true)
done

if [ $FOUND -eq 1 ]; then
  echo ""
  echo -e "${RED}Hardcoded secrets detected! Commit blocked.${NC}"
  echo "Use env var references like \${VAR} or \${VAR:-default} instead."
  echo "Or use: git commit --no-verify"
  exit 1
fi

echo "No hardcoded secrets detected."

# --- Lint + typecheck (read-only) ---
# Only run when staged files include source code so doc-only commits stay fast.
CODE_STAGED=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx|mjs|prisma)$' || true)
if [ -n "$CODE_STAGED" ] && [ -f "package.json" ]; then
  echo ""
  echo "Running lint + typecheck (read-only)..."
  if ! command -v pnpm >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: 'pnpm' command not found in PATH. Skipping pre-commit lint and typecheck.${NC}"
    echo "To enable lint/typecheck in pre-commit, ensure pnpm is accessible in your environment."
  else
    if ! pnpm lint; then
      echo -e "${RED}Lint failed! Commit blocked.${NC}"
      echo "Fix lint errors, or use: git commit --no-verify"
      exit 1
    fi
    if ! pnpm typecheck; then
      echo -e "${RED}Typecheck failed! Commit blocked.${NC}"
      echo "Fix type errors, or use: git commit --no-verify"
      exit 1
    fi
    echo "Lint + typecheck passed."
  fi
fi

exit 0
