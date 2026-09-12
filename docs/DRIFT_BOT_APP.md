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

## Key rotation

Generate a new key on the App's settings page, update
`DRIFT_BOT_APP_PRIVATE_KEY`, then remove the old key. The token is
short-lived (~1 hour) so the swap window is harmless.

## Testing

`scripts/__tests__/post-drift-pr-comment.integration.test.mjs` covers the
identity paths against a fake GitHub API server: token-present on every call,
absent-token skip, empty-string skip, and rejected-token failure.
