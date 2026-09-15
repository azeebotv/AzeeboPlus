# Workflow identities — who acts as whom in CI/CD

Every GitHub Actions workflow makes API calls as **some identity**. Which one
matters: comments, commit statuses, and review requests created by the
*workflow's own* token (`github.token` / `secrets.GITHUB_TOKEN`) are treated
as workflow activity by GitHub — they **enforce branch protection** (blocking
merges they only meant to annotate) and **retrigger workflows** (feedback
loops). Calls that create no PR-visible artifact and no new events (package
pushes, read-only queries, webhook/SSH deploys) are safe on the workflow
identity — **provided** the token is least-privilege.

## Decision rule

```
Does the call create a PR-visible artifact (comment, status, review) or
publish content that GitHub users see in their workflow?
  ├─ yes → use a GitHub App installation token (short-lived, scoped,
  │        exempt from branch-protection enforcement and retriggering)
  └─ no  → workflow token is fine — then enforce least privilege:
           job-level `permissions:`, deny-by-default at the workflow level
```

## Current state (audited 2026-09-12)

| Workflow | Token uses | Identity | Why |
|---|---|---|---|
| `ci.yml`, `pr-checks.yml`, `lint.yml` | build, test, gates | workflow token | no PR-visible writes except the drift bot (below) |
| `pr-checks.yml` → drift bot | PR comment upsert + nightly artifact reads | **`azeebo-drift-bot` App** (see `docs/DRIFT_BOT_APP.md`) | App comments don't enforce branch protection or retrigger CI; the job's own token holds only `contents: read` |
| `schema-lock-nightly.yml` → production tracker | tracking-issue create/update/close | **`azeebo-drift-bot` App** | an App-owned issue doesn't retrigger workflows; the leg's own token holds `contents: read` + `issues: write` (never used for the write) |
| `cd.yml` → `verify-ci-checks` | poll check-runs | workflow token | read-only (`actions: read`, `checks: read`) |
| `cd.yml` → `deploy-staging` | GHCR push | workflow token | `packages: write` — package pushes are not PR-visible and do not retrigger workflows; this is the only write grant in the workflow |
| `cd.yml` → deploys | Coolify webhook / SSH | no GitHub token | outside GitHub entirely |
| `deployment-approval.yml` | `gh run view` | workflow token | read-only; the approval gate itself is GitHub Environment protection rules, not a token |
| `rollback.yml` | GHCR package version list | workflow token | read-only (`packages: read`) |
| `schema-lock-nightly.yml` | read-only live-DB report + artifact upload | workflow token | read-only against the databases; artifacts are uploaded under the workflow identity by design (the tracker step reads the just-written local report) |

No workflow other than the drift bot writes PR-visible artifacts, so no other
App identity is currently warranted. If a future workflow adds PR comments,
commit statuses, or auto-reviews, it must use an App identity per the
decision rule above.

## Least-privilege hardening applied by the audit

- **`cd.yml`** had no workflow-level `permissions:` at all — deploy jobs ran
  with the repo's default token grants inside deployment contexts. Now
  deny-by-default (`contents: read`) at the workflow level, with
  `packages: write` granted only to `deploy-staging` (the only job that
  writes anything) and `checks: read`/`actions: read` only to
  `verify-ci-checks`.
- **`rollback.yml`** read the GHCR package version list with a
  `contents: read`-only token — the call 403'd and the `2>/dev/null` guard
  silently degraded the check to "attempting rollback anyway". Granted
  `packages: read` so the verification actually works.

## Rotation and compromise behavior

- Workflow tokens are ephemeral and repo-scoped; compromise surface is one
  run. Least-privilege `permissions:` blocks cap what a compromised run can
  do.
- The `azeebo-drift-bot` App token is short-lived (~1 h); key rotation is in
  `docs/DRIFT_BOT_APP.md`. Its grants: Pull requests (write), Issues (write),
  Actions (read). A workflow identity — even fully compromised — can no
  longer post PR comments, own issues, or read Actions artifacts.
