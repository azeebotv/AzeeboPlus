# Drift Bot GitHub App — `azeebo-drift-bot`

The PR comment bot (`scripts/post-drift-pr-comment.mjs`, wired in
`.github/workflows/pr-checks.yml` → `prisma-migrations-pr`) posts schema-lock
drift tables on pull requests **under its own GitHub App identity**, not the
workflow's `github.token`.

## Why an App identity

Comments created by the *workflow's own* identity (`github.token`) are
treated as workflow activity by GitHub:

- They **enforce branch protection** — a drift comment on the head SHA can
  block merges it was only meant to annotate.
- They **retrigger workflows** on the PR (a feedback loop: the bot comments,
  new runs start, the bot comments again).
- Every comment is attributed to the generic `github-actions` bot, so
  reviewers cannot tell automation from the workflow that produced it.

Comments created by a **GitHub App installation token** are exempt from
those triggers and are attributed to the App itself. Splitting the identity
also lets the job's own `github.token` drop to `contents: read` — it never
calls the API at all anymore.

## Registration (one-time, org/repo admin)

1. **Settings → Developer settings → GitHub Apps → New GitHub App**
   - Name: `azeebo-drift-bot`
   - Homepage URL: this repository.
   - **Webhook: uncheck "Active"** — the bot is pull-only; no webhook needed.
   - Permissions:
     | Permission | Access | Why |
     |---|---|---|
     | Pull requests | Read and write | Upsert the drift comment on PRs |
     | Issues | Read and write | Own the production-drift tracking issue (create/update/close — see below) |
     | Actions | Read-only | Fetch the nightly `schema-lock-report-<env>-<run_id>` artifacts for the live-environment section |
     | Contents | no access | The bot never reads or writes code |
     | Metadata | Read-only | (forced on by GitHub) |
2. **Where to install:** Only select repositories → this repo (least power).
3. From the App's settings page, note the **App ID**.
4. **Generate a private key** (`.pem`) — it is shown exactly once.
5. Install the App on this repository (the installation grants the token its
   scope; no installation ID needs to be configured —
   `actions/create-github-app-token` resolves it from `owner`).

## Repository configuration

| Where | Name | Value |
|---|---|---|
| **Variables** (`vars`) | `DRIFT_BOT_APP_ID` | The numeric App ID |
| **Secrets** (`secrets`) | `DRIFT_BOT_APP_PRIVATE_KEY` | The full `.pem` contents |

Both live at repository (or org) level. The workflow's mint step is gated on
`vars.DRIFT_BOT_APP_ID != '' && secrets.DRIFT_BOT_APP_PRIVATE_KEY != ''` —
`secrets.X != ''` evaluates inside the runner context, so an unconfigured
secret makes the condition false without failing the run.

## Behavior matrix

| State | What happens |
|---|---|
| App configured, gates red | Comment posted/updated **as `azeebo-drift-bot`** |
| App configured, gates green, no prior comment | Silent skip (no comment) |
| App configured, gates green, prior red comment | Prior comment cleared in place to ✅ |
| App configured, nightly API down | Gate-only comment still ships (live section omitted) |
| App **not** configured | Mint step skipped → bot logs `no GITHUB_TOKEN — drift-comment App not configured for this repo; skipping comment (not an error)` and exits 0. Gates still run and still fail the PR; only the comment is missing. |
| Token minted but rejected (App uninstalled / key rotated) | Mint step or bot fails → the run goes red (a present-but-broken identity is a real failure, not a silent skip) |

There is deliberately **no fallback to `github.token`** — a hidden fallback
would silently reintroduce the workflow identity this split removes.

## Production-drift tracking issue

Beyond PR comments, the App owns ONE tracking issue for production schema
drift (found by the `<!-- azeebo:prod-drift-tracking -->` marker via issue
search): the nightly workflow's production leg runs
`scripts/update-drift-tracking-issue.mjs`, which

- **creates** the issue when drift first appears,
- **updates** it in place only when the violating-service set changes (no
  noisy nightly edits),
- **closes** it with a resolved body when a nightly run finds production
  clean, and **reopens** it if drift returns,
- **skips loudly** when the App is not configured (no fallback to the
  workflow token — an App-owned issue does not retrigger workflows; a
  workflow-owned one would).

The tracker reads the report the nightly run just wrote (`DRIFT_LOCAL_REPORT`)
— the freshest *completed* run's artifact is still yesterday's at that point.

## Weekly tracker staleness sweep

A service can stay in the tracker forever if its database was
**decommissioned** (dropped with the service) while it carried a blocking
row: the nightly's own NO-DB path eventually stops listing it, but that
self-heal launders the history, does nothing on weeks the nightly cannot
run, and never fires when a fossilized database keeps flapping
ERROR/BLOCKED-LEDGER.

The weekly drift sweep workflow (`drift-sweep-schedule.yml` →
`drift-tracker-sweep` job) runs `scripts/sweep-drift-tracker.mjs` under the
App identity to close that hole:

- parses the **open tracker's own violation table** (the source of truth —
  works even when the nightly is broken),
- probes each listed service against the production DB host using the same
  naming convention + existence probe as the nightly
  (`scripts/lib/live-db-probe.mjs`),
- **removes only entries whose database no longer exists** — a decommission,
  never a "fix" — with a durable note in the issue naming what was removed,
  so the decision is auditable,
- **aborts without editing** when more than a couple of probes fail (an
  unverifiable host must not become "everything is stale"), and closes the
  tracker if every listed entry turns out to be gone.

Requires the production DB credentials (`DB_HOST` / `DB_PORT` / `DB_USER` /
`DB_PASSWORD` on the `production` environment, the same secrets the nightly
uses) in addition to the App configuration. Unconfigured App or missing DB
secrets → a visible skip, never a fallback. The probes are read-only
(`pg_database` existence checks); the sweep never writes to any database.

## Key rotation

Generate a new key on the App's settings page, update
`DRIFT_BOT_APP_PRIVATE_KEY`, then remove the old key. The token is
short-lived (~1 hour) so the swap window is harmless.

## Testing

`scripts/__tests__/post-drift-pr-comment.integration.test.mjs` covers the
identity paths against a fake GitHub API server: token-present on every call,
absent-token skip, empty-string skip, and rejected-token failure.
`scripts/__tests__/sweep-drift-tracker.integration.test.mjs` covers the
weekly staleness sweep the same way (plus a fake `psql` shim simulating
database existence, per-probe failures, and a dead host).
