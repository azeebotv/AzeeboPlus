#!/usr/bin/env bash
# ============================================================
# verify-deployed-image-tag.sh — prove the deploy is serving the tag CI published
# ============================================================
# A green /health only says *something* answers. It cannot tell a fresh deploy
# from the previous container that Coolify never replaced, and the old SHA step
# made that worse: it passed when commitSha was absent or "dev", i.e. exactly
# when the artifact was unidentifiable. This script makes the post-deploy gate
# fail unless the running deployment is the image tag this run published.
#
# Tags are pointers; a running container only exposes the commit baked into it
# (COMMIT_SHA build arg → GET /version). So the check is two-sided:
#
#   1. ARTIFACT — /version (fallback /health) must report this tag's commit.
#      Missing "dev" is a failure: the image was built without COMMIT_SHA.
#   2. SELECTOR — when the deploy went through Coolify, the app's IMAGE_TAG
#      (the compose interpolation variable that picks the image) must equal
#      this tag. A stale selector means the next redeploy silently ships the
#      old build, and the container currently running may already be it.
#
# The outcome is also written to $GITHUB_STEP_SUMMARY (when Actions sets it) so
# a reviewer opening the run sees which build shipped — and, on failure, which
# build was found instead — without expanding the job log.
#
# Usage:
#   verify-deployed-image-tag.sh [--rollback] <tag> <health-base-url>
#
#   verify-deployed-image-tag.sh staging-1a2b3c4d https://staging-api.example
#
#   --rollback  verify what a rollback restored. Two differences from a deploy:
#               a moving tag (`latest`, `staging`, a bare SHA) is accepted,
#               since a rollback legitimately restores one — the commit cannot
#               be compared against the tag, so /version's report is recorded
#               instead; and the step summary is titled a rollback, naming the
#               tag that was restored and the commit that came back up.
#
#   verify-deployed-image-tag.sh --rollback latest https://api.example
#
# Env:
#   COOLIFY_API_URL, COOLIFY_API_TOKEN, COOLIFY_APP_UUID
#                         read the app's IMAGE_TAG (GET .../envs)
#   COOLIFY_WEBHOOK       presence means Coolify performed this deploy; with it
#                         set, missing API credentials are a FAILURE, not a skip
#   VERIFY_ENVIRONMENT    environment name for the summary when the tag carries
#                         none (rollback of a moving tag); the tag wins when it
#                         does, since the tag is the thing being verified
#   VERIFY_TIMEOUT_S      per-request timeout (default 15)
#   VERIFY_WAIT_S         wait up to this long for the expected build to appear
#                         (default 0) — a Coolify redeploy rolls over asynchronously
#   VERIFY_POLL_S         poll interval while waiting (default 5)
#   GITHUB_STEP_SUMMARY   when set (always, in Actions), the verified tag is
#                         appended as a markdown table; ignored locally
#
# Exit codes:
#   0  running deployment matches the tag (and, when checkable, Coolify's selector)
#   1  mismatch, unidentifiable artifact, or Coolify deployed without a tag check
#   2  bad usage
# ============================================================

set -euo pipefail

# --rollback may appear anywhere; everything else is positional, in order.
MODE="deploy"
POSITIONAL=()
for arg in "$@"; do
  case "$arg" in
    --rollback) MODE="rollback" ;;
    *) POSITIONAL+=("$arg") ;;
  esac
done

TAG="${POSITIONAL[0]:-}"
HEALTH_URL="${POSITIONAL[1]:-}"
TIMEOUT="${VERIFY_TIMEOUT_S:-15}"

if [[ -z "$TAG" || -z "$HEALTH_URL" ]]; then
  echo "usage: $0 [--rollback] <tag> <health-base-url>" >&2
  echo "   e.g. $0 staging-1a2b3c4d https://staging-api.example" >&2
  echo "        $0 --rollback latest https://api.example   (a restored moving tag)" >&2
  exit 2
fi
HEALTH_URL="${HEALTH_URL%/}"

# <environment>-<sha>: the shape cd.yml publishes. The SHA is the only part a
# running container can prove, so a deploy is never verified without one.
PINNED=1
if [[ "$TAG" =~ ^([a-z][a-z0-9-]*)-([0-9a-f]{7,40})$ ]]; then
  ENVIRONMENT="${BASH_REMATCH[1]}"
  EXPECTED_SHA="${BASH_REMATCH[2]}"
  EXPECTED_SHA_LC="$(printf '%s' "$EXPECTED_SHA" | tr '[:upper:]' '[:lower:]')"
else
  if [[ "$MODE" != "rollback" ]]; then
    echo "✗ invalid expected tag '${TAG}': expected <environment>-<sha>, e.g. staging-1a2b3c4d" >&2
    echo "  (--rollback accepts a moving tag such as 'latest' or 'staging')" >&2
    exit 2
  fi
  PINNED=0
  EXPECTED_SHA=""
  EXPECTED_SHA_LC=""
  ENVIRONMENT="${VERIFY_ENVIRONMENT:-unknown}"
fi

# ── Step summary ────────────────────────────────────────────────────────────
# Written from an EXIT trap so a failed gate reports *which* build it found,
# not just that it refused. Values are recorded as the checks discover them.
SUMMARY_RESULT=""
SUMMARY_REASON=""
RUNNING_COMMIT=""
SELECTOR_TAG=""

write_summary() {
  [[ -n "${GITHUB_STEP_SUMMARY:-}" ]] || return 0
  local run_cell="_not checked_"
  if [[ -n "${GITHUB_SERVER_URL:-}" && -n "${GITHUB_REPOSITORY:-}" && -n "${GITHUB_RUN_ID:-}" ]]; then
    run_cell="[run ${GITHUB_RUN_ID}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID})"
  fi
  local title="Deploy verification" label="Shipped build"
  if [[ "$MODE" == "rollback" ]]; then
    title="Rollback verification"
    label="Restored build"
  fi
  local expected_cell="\`${EXPECTED_SHA_LC}\`"
  [[ $PINNED -eq 1 ]] || expected_cell="_moving tag — no commit pinned_"
  {
    echo "### ${title} — ${ENVIRONMENT}"
    echo
    echo "**${label}:** \`${TAG}\` (commit \`${RUNNING_COMMIT:-unknown}\`)"
    echo
    echo "| Field | Value |"
    echo "|-------|-------|"
    echo "| Result | ${SUMMARY_RESULT:-❌ not reached} |"
    echo "| Image tag | \`${TAG}\` |"
    echo "| Expected commit | ${expected_cell} |"
    echo "| Running commit | ${RUNNING_COMMIT:-_not reported_} |"
    echo "| Coolify \`IMAGE_TAG\` | ${SELECTOR_TAG:-_not checked_} |"
    echo "| Health endpoint | ${HEALTH_URL} |"
    echo "| Workflow run | ${run_cell} |"
    if [[ -n "$SUMMARY_REASON" ]]; then
      echo
      if [[ "$SUMMARY_RESULT" == ❌* ]]; then
        echo "**Why it failed:** ${SUMMARY_REASON}"
      else
        echo "_${SUMMARY_REASON}_"
      fi
    fi
    echo
  } >>"$GITHUB_STEP_SUMMARY" 2>/dev/null || true
}
trap write_summary EXIT

# Records a failure in the step summary, prints the same lines to the log and
# exits 1. The first argument is the short cause shown in the summary.
fail() {
  SUMMARY_RESULT="❌ failed"
  SUMMARY_REASON="$1"
  shift
  printf '%s\n' "$@" >&2
  exit 1
}

fetch() {
  curl -fsS --max-time "$TIMEOUT" --retry 2 --retry-delay 2 "$1" 2>/dev/null || true
}

# Full SHAs are normal; a short SHA still identifies the build if it is a
# prefix of the expected one (or vice versa). Anything else is a different
# commit.
sha_matches() {
  local a="$1" b="$2"
  [[ "$a" == "$b" ]] && return 0
  [[ ${#a} -ge 7 && ${#b} -ge 7 ]] || return 1
  [[ "$b" == "$a"* || "$a" == "$b"* ]]
}

# ── 1. Which build is actually running? ────────────────────────────────────
# Coolify rolls a deployment over asynchronously, so the old container can
# still be answering when this runs. Poll for the expected build up to
# VERIFY_WAIT_S, then judge whatever is left.
WAIT="${VERIFY_WAIT_S:-0}"
POLL="${VERIFY_POLL_S:-5}"
DEADLINE=$((SECONDS + WAIT))
KIND=""

while :; do
  DEPLOYED_JSON="$(fetch "${HEALTH_URL}/version")"
  if [[ -z "$DEPLOYED_JSON" ]] || ! jq -e . >/dev/null 2>&1 <<<"$DEPLOYED_JSON"; then
    DEPLOYED_JSON="$(fetch "${HEALTH_URL}/health")"
  fi

  KIND="unreachable"
  RUNNING_COMMIT=""
  if [[ -n "$DEPLOYED_JSON" ]] && jq -e . >/dev/null 2>&1 <<<"$DEPLOYED_JSON"; then
    RUNNING_COMMIT="$(
      jq -r '(.commitSha // .info.apiGateway.commitSha // .details.apiGateway.commitSha // empty)' \
        <<<"$DEPLOYED_JSON" 2>/dev/null | head -n1
    )"
    RUNNING_COMMIT="$(printf '%s' "$RUNNING_COMMIT" | tr '[:upper:]' '[:lower:]')"
    if [[ -z "$RUNNING_COMMIT" ]]; then
      KIND="missing"
      RUNNING_COMMIT="_none reported_"
    elif [[ "$RUNNING_COMMIT" == "dev" ]]; then
      KIND="dev"
    elif [[ $PINNED -eq 0 ]]; then
      # A moving tag (rollback to `latest`/`staging`) names no commit, so the
      # only possible evidence is what /version reports. Record it.
      KIND="observed"
    elif sha_matches "$RUNNING_COMMIT" "$EXPECTED_SHA_LC"; then
      KIND="match"
    else
      KIND="wrong"
    fi
  fi

  [[ "$KIND" == "match" || "$KIND" == "observed" ]] && break
  [[ $SECONDS -ge $DEADLINE ]] && break
  sleep "$POLL"
done

case "$KIND" in
  match)
    echo "✅ Running artifact matches ${TAG} (commit ${RUNNING_COMMIT})"
    echo "::notice title=Deploy verified::Serving ${TAG} (commit ${EXPECTED_SHA_LC}) on ${HEALTH_URL}"
    SUMMARY_RESULT="✅ verified"
    ;;
  observed)
    echo "✅ ${TAG} is live (commit ${RUNNING_COMMIT}) — moving tag, so the commit is recorded, not compared"
    echo "::notice title=Rollback verified::Restored ${TAG} (commit ${RUNNING_COMMIT}) on ${HEALTH_URL}"
    SUMMARY_RESULT="✅ restored — commit read from /version"
    ;;
  unreachable)
    fail "could not read a JSON version/health payload from ${HEALTH_URL}" \
      "::error::could not read a JSON version/health payload from ${HEALTH_URL}" \
      "✗ cannot identify the running artifact — treat the deploy as unverified"
    ;;
  missing)
    fail "${HEALTH_URL} reports no commitSha (image built without COMMIT_SHA)" \
      "::error::${HEALTH_URL} reports no commitSha — the running image was built without COMMIT_SHA, so it cannot be the ${TAG} artifact"
    ;;
  dev)
    fail "${HEALTH_URL} reports commitSha=dev (COMMIT_SHA was not baked in)" \
      "::error::${HEALTH_URL} reports commitSha=dev (COMMIT_SHA was not baked in); this cannot be verified as ${TAG}"
    ;;
  wrong)
    fail "${HEALTH_URL} is serving commit ${RUNNING_COMMIT}, not ${EXPECTED_SHA_LC}" \
      "::error::wrong deployment: ${HEALTH_URL} is running commit ${RUNNING_COMMIT}, expected ${EXPECTED_SHA_LC} (tag ${TAG})"
    ;;
esac

# ── 2. Is Coolify's selector pointing at this tag? ─────────────────────────
COOLIFY_WEBHOOK="${COOLIFY_WEBHOOK:-}"

# A rollback over SSH pins the image ref in `docker run`, so the restored tag
# never touched Coolify's IMAGE_TAG — and the value left there is the previous
# deploy's. Judging it would fail a rollback that worked. Coolify's selector is
# only authoritative for a deployment Coolify performed.
if [[ -z "$COOLIFY_WEBHOOK" && "$MODE" == "rollback" ]]; then
  echo "::warning::rollback ran over SSH — Coolify IMAGE_TAG is not authoritative here; verified the restored artifact only"
  SUMMARY_RESULT="⚠️ restored artifact verified — \`IMAGE_TAG\` not checked (SSH rollback)"
  SUMMARY_REASON="Coolify did not perform this rollback, so its IMAGE_TAG still names the previous deploy and was not used as evidence."
  exit 0
fi

missing=()
for var in COOLIFY_API_URL COOLIFY_API_TOKEN COOLIFY_APP_UUID; do
  [[ -n "${!var:-}" ]] || missing+=("$var")
done

if [[ ${#missing[@]} -gt 0 ]]; then
  if [[ -n "$COOLIFY_WEBHOOK" ]]; then
    # The deploy itself went through Coolify, so the app's IMAGE_TAG decided
    # which image was served. Without the API we cannot prove it, and the
    # previous run's tag is the most likely value — fail closed.
    fail "Coolify deployed this environment but ${missing[*]} is unset, so IMAGE_TAG=${TAG} cannot be verified" \
      "::error::Coolify deployed this environment but ${missing[*]} is unset, so IMAGE_TAG=${TAG} cannot be verified" \
      "✗ refusing to certify a Coolify deploy without a tag check"
  fi
  echo "::warning::Coolify API not configured (missing ${missing[*]}) — IMAGE_TAG check skipped; verified the artifact commit only"
  SUMMARY_RESULT="⚠️ artifact verified — \`IMAGE_TAG\` not checked (no Coolify API credentials)"
  SUMMARY_REASON="Only the artifact could be checked; the deploy did not go through Coolify, so its IMAGE_TAG selector was not read."
  exit 0
fi

API="${COOLIFY_API_URL%/}/api/v1"
ENDPOINT="${API}/applications/${COOLIFY_APP_UUID}/envs"

ENVS_JSON="$(
  curl -fsS --max-time "$TIMEOUT" --retry 2 --retry-delay 2 \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Accept: application/json" \
    "$ENDPOINT" 2>/dev/null || true
)"
if [[ -z "$ENVS_JSON" ]] || ! jq -e . >/dev/null 2>&1 <<<"$ENVS_JSON"; then
  fail "could not read application envs from the Coolify API (unreachable or token rejected)" \
    "::error::could not read application envs from ${ENDPOINT} (Coolify API unreachable or token rejected)"
fi

# Envs come back as a bare array; tolerate a {data: [...]} envelope too.
CONFIGURED_TAG="$(
  jq -r 'if type == "array" then . else (.data // []) end
         | .[] | select(.key == "IMAGE_TAG")
         | (.value // .real_value // empty)' <<<"$ENVS_JSON" 2>/dev/null | head -n1
)"
SELECTOR_TAG="${CONFIGURED_TAG:-_missing_}"

if [[ -z "$CONFIGURED_TAG" ]]; then
  fail "the Coolify app has no IMAGE_TAG env var — compose would fall back to :dev" \
    "::error::Coolify app ${COOLIFY_APP_UUID} has no IMAGE_TAG env var — the compose file would fall back to :dev instead of ${TAG}"
fi
if [[ "$CONFIGURED_TAG" != "$TAG" ]]; then
  fail "Coolify is configured to deploy IMAGE_TAG=${CONFIGURED_TAG}, but this run published ${TAG}" \
    "::error::Coolify is configured to deploy IMAGE_TAG=${CONFIGURED_TAG}, but this run published ${TAG}" \
    "✗ wrong tag selected: a redeploy would serve the ${CONFIGURED_TAG} image"
fi

echo "✅ Coolify IMAGE_TAG=${TAG}"
if [[ $PINNED -eq 1 ]]; then
  echo "✅ Deployment verified: serving ${TAG} (commit ${EXPECTED_SHA_LC})"
  SUMMARY_RESULT="✅ verified — artifact and Coolify selector both match"
else
  echo "✅ Rollback verified: ${TAG} is live (commit ${RUNNING_COMMIT}); Coolify IMAGE_TAG matches"
  SUMMARY_RESULT="✅ verified — moving tag is live and the Coolify selector matches"
fi
