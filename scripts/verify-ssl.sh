#!/usr/bin/env bash
# ============================================================
# Azeebo+ SSL Certificate Verification
# ============================================================
# Checks SSL certificate expiry, chain, and HTTPS connectivity.
#
# Usage:
#   ./scripts/verify-ssl.sh [domain] [port]
#
# Arguments:
#   domain  - Domain to check (default: app.azeeboplus.com)
#   port    - Port to check (default: 443)
# ============================================================
set -euo pipefail

# ---- Configuration ----
DOMAIN="${1:-app.azeeboplus.com}"
PORT="${2:-443}"
WARN_DAYS="${WARN_DAYS:-30}"
CRITICAL_DAYS="${CRITICAL_DAYS:-7}"

# ---- Colors ----
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; RESET=''
fi

log()   { printf "%s${CYAN}[INFO]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
ok()    { printf "%s${GREEN}[  OK]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
warn()  { printf "%s${YELLOW}[WARN]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
error() { printf "%s${RED}[FAIL]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*" >&2; }

# ---- Prerequisites ----
if ! command -v openssl &>/dev/null; then
  error "openssl is required but not found"
  exit 1
fi

# ---- Main ----
section() {
  echo ""
  printf "%s${BOLD}── %s ──%s\n" "$CYAN" "$1" "$RESET"
}

check_ssl() {
  local domain="$1" port="$2"
  local failed=0
  local expiry_date expiry_epoch now_epoch days_left

  section "SSL Certificate Report: ${domain}:${port}"

  # 1. Connect and get certificate
  log "Connecting to ${domain}:${port}..."
  local cert_output
  cert_output="$(echo | openssl s_client \
    -connect "${domain}:${port}" \
    -servername "${domain}" \
    2>/dev/null)" || true

  if [[ -z "$cert_output" ]] || ! echo "$cert_output" | grep -q "BEGIN CERTIFICATE"; then
    error "Failed to connect to ${domain}:${port}"
    error "Cannot retrieve SSL certificate"
    return 1
  fi

  ok "Connection established"

  # 2. Certificate expiry
  section "Certificate Expiry"
  expiry_date="$(echo "$cert_output" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)"
  if [[ -n "$expiry_date" ]]; then
    expiry_epoch="$(date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null || \
                    date -d "$expiry_date" +%s 2>/dev/null || echo 0)"
    now_epoch="$(date +%s)"
    days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

    if (( days_left <= 0 )); then
      error "Certificate EXPIRED ${days_left#-} days ago"
      failed=$((failed + 1))
    elif (( days_left <= CRITICAL_DAYS )); then
      error "Certificate expires in ${days_left} days (CRITICAL)"
      failed=$((failed + 1))
    elif (( days_left <= WARN_DAYS )); then
      warn "Certificate expires in ${days_left} days (renew soon)"
    else
      ok "Certificate expires in ${days_left} days"
    fi

    printf "  Expiry date:  %s\n" "$expiry_date"
    printf "  Days left:    %s\n" "$days_left"
  else
    error "Could not parse certificate expiry date"
    failed=$((failed + 1))
  fi

  # 3. Certificate chain verification
  section "Certificate Chain"
  local verify_output
  verify_output="$(echo | openssl s_client \
    -connect "${domain}:${port}" \
    -servername "${domain}" \
    -verify_return_error \
    2>&1)" || true

  if echo "$verify_output" | grep -q "Verify return code: 0"; then
    ok "Certificate chain is valid"
  else
    local verify_code
    verify_code="$(echo "$verify_output" | grep -o "Verify return code: [0-9]*" | head -1 | awk '{print $NF}')"
    error "Certificate chain verification failed (code: ${verify_code:-unknown})"
    # Extract error message
    local verify_msg
    verify_msg="$(echo "$verify_output" | grep "Verify return code:" | head -1)"
    if [[ -n "$verify_msg" ]]; then
      printf "  %s\n" "$verify_msg"
    fi
    failed=$((failed + 1))
  fi

  # 4. Certificate details
  section "Certificate Details"
  local subject issuer serial san
  subject="$(echo "$cert_output" | openssl x509 -noout -subject 2>/dev/null | sed 's/^subject=//')"
  issuer="$(echo "$cert_output" | openssl x509 -noout -issuer 2>/dev/null | sed 's/^issuer=//')"
  serial="$(echo "$cert_output" | openssl x509 -noout -serial 2>/dev/null | cut -d= -f2)"
  san="$(echo "$cert_output" | openssl x509 -noout -ext subjectAltName 2>/dev/null | grep -A1 "Subject Alternative" | tail -1 | sed 's/^[[:space:]]*//')"

  printf "  Subject:    %s\n" "${subject:-unknown}"
  printf "  Issuer:     %s\n" "${issuer:-unknown}"
  printf "  Serial:     %s\n" "${serial:-unknown}"
  [[ -n "$san" ]] && printf "  SAN:        %s\n" "$san"

  # 5. HTTPS connectivity test
  section "HTTPS Connectivity"
  local http_code
  http_code="$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 10 \
    "https://${domain}:${port}/" 2>/dev/null)" || true

  if [[ -n "$http_code" ]] && (( http_code >= 200 && http_code < 400 )); then
    ok "HTTPS responded with HTTP ${http_code}"
  elif [[ "$http_code" == "000" ]]; then
    warn "HTTPS connection timed out or failed (no response)"
  else
    warn "HTTPS responded with HTTP ${http_code}"
  fi

  # 6. TLS version check
  section "TLS Protocol"
  for proto in tls1_2 tls1_3; do
    if echo | openssl s_client -connect "${domain}:${port}" \
      -servername "${domain}" \
      -"${proto}" 2>/dev/null | grep -q "BEGIN CERTIFICATE"; then
      ok "  ${proto} supported"
    else
      warn "  ${proto} not available"
    fi
  done

  # Summary
  section "Summary"
  if (( failed > 0 )); then
    error "SSL check failed with ${failed} issue(s)"
    return 1
  else
    ok "All SSL checks passed for ${domain}:${port}"
    return 0
  fi
}

# ---- Entry point ----
check_ssl "$DOMAIN" "$PORT"
