# Audit Documentation

> Point-in-time audit reports and fix lists from past audit sessions. Preserved for traceability of what was found and fixed, and when.

---

## Documents

| Document | Period / Date | Purpose |
|----------|--------------|---------|
| [2026-10-05-FULL-STACK-AUDIT.md](2026-10-05-FULL-STACK-AUDIT.md) | Oct 5, 2026 · `Major-Upgrade` | Full-stack repository audit report (89 findings, AUD-01 to AUD-89) |
| [SESSION-REPORT.md](SESSION-REPORT.md) | Aug 18–24, 2026 · `Major-Upgrade` | Complete audit session report: 459 commits, 486 files changed |
| [COMPREHENSIVE-REPORT.md](COMPREHENSIVE-REPORT.md) | Aug 2025 · `Major-Upgrade` | Full audit implementation report: 28 audit-session commits |
| [2026-07-29-SECURITY-AUDIT.md](2026-07-29-SECURITY-AUDIT.md) | Jul 29, 2026 · `main` | Deep codebase security audit report (25/25 issues resolved) |
| [todo.md](todo.md) | 2026-08-18 · `Major-Upgrade` | Frontend ↔ backend consistency audit & fix list |

## What Belongs Here

- **Do add:** dated audit reports, security reviews, and fix lists once the audit
  session is **closed**. Name or head each file with its date and branch so the
  point-in-time context survives.
- **Don't add:** anything still being worked from — keep the live fix list in the
  issue tracker or a `TODO.md` at the repo root until the session closes, then move
  it here. Living runbooks and policies belong in
  [`docs/engineering/`](../engineering/) instead.
