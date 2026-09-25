#!/bin/bash
# =============================================================
# CRIT-01: Block .env files with placeholder secrets
#
# Three checks:
#   1. Block new non-example .env files from being staged
#   2. Scan committed .env files for placeholder secrets
#   3. Scan committed .env files for real-looking leaked secrets
#
# Works on bash 3+ (macOS) and bash 4+ (Ubuntu CI).
#
# Exit codes:
#   0 = all checks passed
#   1 = violations found
# =============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VIOLATIONS=0

# ── 1. Block new non-example .env files from being staged ──────────
STAGED_ENV_FILES=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | grep -E '\.env' || true)

if [[ -n "$STAGED_ENV_FILES" ]]; then
  while IFS= read -r file; do
    is_allowed=false
    case "$file" in
      *.env.example|*.env.local|*.env.docker|*.env.production|deploy/staging.env)
        is_allowed=true ;;
    esac
    if [[ "$is_allowed" == "false" ]]; then
      echo -e "${RED}VIOLATION: New .env file being added to git: ${file}${NC}"
      echo -e "${RED}  .env files must not be committed. Use .env.example for templates.${NC}"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done <<< "$STAGED_ENV_FILES"
fi

# ── 2+3. Scan committed .env files for placeholder secrets and leaks ──
COMMITTED_ENV_FILES=$(git ls-files 2>/dev/null | grep -E '(^|/)\\.env(\\..*)?$' || true)

if [[ -n "$COMMITTED_ENV_FILES" ]]; then
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue

    # Skip exempt files
    case "$file" in
      *.env.example|*.env.local|*.env.docker) continue ;;
    esac

    [[ ! -f "$file" ]] && continue

    while IFS= read -r line; do
      # Skip comments and empty lines
      [[ "$line" =~ ^[[:space:]]*# ]] && continue
      [[ -z "$line" ]] && continue

      var_name="${line%%=*}"
      value="${line#*=}"

      # ── Placeholder check (check 2) ──
      for pattern in \
        'change-me-in-production' \
        'your-super-secret' \
        'CHANGEME' \
        'REPLACE_ME' \
        'INSERT_.*_HERE' \
        'changeme' \
        'replace-this' \
        'your-.*-here' \
        'insert-your' \
        'set-in-production' \
        'placeholder'
      do
        if echo "$line" | grep -qiE "$pattern"; then
          echo -e "${YELLOW}PLACEHOLDER: ${file} contains weak secret:${NC}"
          echo -e "  ${var_name}=... (matches pattern: ${pattern})"
          VIOLATIONS=$((VIOLATIONS + 1))
          break
        fi
      done

      # ── Real secret leak check (check 3) ──
      # Skip known non-secret keys
      case "$var_name" in
        *_URL|*_HOST|*_PORT|*_NAME|*_USER|*_DB|*_SCHEMA|*_DIR|*_PATH|*_MODE|*_LEVEL|*_ENABLED|*_DISABLED|*_TIMEOUT|*_INTERVAL|*_SIZE|*_ADDR|*_ORIGIN*|*_ALLOWED*|NODE_ENV|PORT|HOSTNAME|LOG_*|DEBUG|API_VERSION)
          continue ;;
      esac

      # Detect real-looking secrets: >40 chars, mixed case + digits
      if [[ ${#value} -ge 40 ]] \
        && echo "$value" | grep -qE '[A-Z]' \
        && echo "$value" | grep -qE '[a-z]' \
        && echo "$value" | grep -qE '[0-9]'
      then
        # Skip URLs and connection strings
        if echo "$value" | grep -qE '^(http|postgresql|redis|mongodb)://'; then
          continue
        fi
        echo -e "${RED}LEAK: ${file} may contain a real secret:${NC}"
        echo -e "  ${var_name}=<${#value}-char value>"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
    done < "$file"
  done <<< "$COMMITTED_ENV_FILES"
fi

# ── Summary ────────────────────────────────────────────────────────
echo ""
if [[ $VIOLATIONS -gt 0 ]]; then
  echo -e "${RED}Found ${VIOLATIONS} secret violation(s).${NC}"
  echo -e "${RED}Fix the issues above before committing.${NC}"
  echo ""
  echo "Tips:"
  echo "  - .env files should be in .gitignore (only .env.example is tracked)"
  echo "  - Use placeholder values like 'your-key-here' in .env.example files"
  echo "  - Never commit real secrets — use GitHub Secrets or a secrets manager"
  exit 1
else
  echo -e "${GREEN}All .env secret checks passed.${NC}"
  exit 0
fi
