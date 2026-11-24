# Git-History Purge Plan — AUD-05

**Finding:** AUD-05 (High, the last open P0 from `audit.md`)
**Targets:** `deploy/staging.env`, `apps/mobile/android/app/debug.keystore`
**Status:** PLANNED — do not execute without maintainer sign-off and a scheduled freeze window
**Verified against:** `Major-Upgrade` @ `bc265c1c`, 2026-10-02 (all facts below re-checked in this clone; full, non-shallow history)

---

## 1. Why this matters

| Artifact | Introduced in | Commits after it (of 586) | Exposure |
|---|---|---|---|
| `apps/mobile/android/app/debug.keystore` | `3699d416` (2026-07-03, "fix: add @nestjs/config dependency…" — smuggled into an unrelated commit) | 413 | **Live signing artifact.** Anyone with repo read access can sign APKs as this app's debug identity. |
| `deploy/staging.env` | `121db5dc` (2026-07-23), modified `1495b371` (2026-07-31) | 282 / 215 | Values verified as `<set-via-secret…>` **placeholders** — no live credentials. Discloses internal topology: service names, DB names, env structure. |

Both files are deleted in the working tree (deletions **staged**, not yet committed) and `.gitignore` rules exist (lines 29–37: `deploy/*.env`, `*.keystore`) but the `.gitignore` change is also **uncommitted**. History still fully recovers both files today:

```
$ git log --all --oneline -- deploy/staging.env
1495b371 …
121db5dc …
$ git log --all --oneline -- apps/mobile/android/app/debug.keystore
3699d416 fix: add @nestjs/config dependency to subscription-service
```

Scope check (2026-10-02): these are the **only** `.env`/`.keystore`/`.pem`/`.p12` paths that ever existed in history — no other purge targets found.

---

## 2. Timeline & effort

| Phase | What | When | Owner |
|---|---|---|---|
| 0 | Baseline scan + inventory (gitleaks history, open PRs, forks) | Day 1 | Maintainer |
| 1 | Rotations + keystore regen prep (independent of purge) | Day 1–2 | Maintainer + mobile dev |
| 2 | Commit pending deletions/.gitignore; freeze window announced | Day 2 | Maintainer |
| 3 | Backup mirror + history rewrite + force-push | Freeze window (~30–60 min) | Maintainer |
| 4 | Team: re-clone / re-point, PRs re-based | During window | Everyone |
| 5 | GitHub-side GC (support ticket) + fork audit | Day 2–3 | Maintainer |
| 6 | Validation + unfreeze | End of window | Maintainer |

Phases 0–2 are safe prep and remove most of the risk. The irreversible step is **Phase 3**.

---

## 3. Phase 0 — Baseline & inventory (read-only)

```bash
# Install tooling (none of these are on the dev machines yet)
brew install git-filter-repo gitleaks gh      # or: pipx install git-filter-repo

# 1. Full-history secret scan — this is the ground truth for what was ever committed.
#    Redact values out of the report; file issues for anything NEW it finds.
gitleaks git --redact --report-format json --report-path gitleaks-history-baseline.json .

# 2. Confirm exact purge targets (expect the 3 commits from the table above)
git log --all --oneline -- deploy/staging.env
git log --all --oneline -- apps/mobile/android/app/debug.keystore

# 3. Review the staging.env content once, for rotation scope: are ALL values
#    placeholders, or did any real value ever get committed? (Redact before sharing.)
git show 1495b371:deploy/staging.env

# 4. Inventory what the rewrite will disturb
git branch -a --contains 3699d416        # → main, Major-Upgrade, Dev-Branch, Agbala-Olodumare-Implementation
git branch -r | wc -l                    # → 10 remote branches (incl. 4 dependabot/*)
git tag                                  # → 1 tag
gh pr list --state open                  # every open PR will need a rebase after the rewrite
gh api repos/azeebotv/AzeeboPlus/forks   # ANY fork keeps the old history → Phase 5
```

**Decision gate:** if gitleaks finds anything beyond the two known paths, extend the purge path list before Phase 3 (re-run Phase 0 — it's cheap).

---

## 4. Phase 1 — Rotations (do these regardless of when the purge happens)

Rotation is the only thing that makes the purge *and* its residual GitHub caches harmless. Do it **before** the rewrite.

1. **Staging secrets:** confirm every real value lives only in the secret manager / CI secrets (`GH Actions secrets`, Coolify env). Even though committed values are placeholders, rotate any staging credential that was ever real, and confirm `staging.env` in the secret manager differs from anything that was ever committed.
2. **Regenerate the Android debug keystore** (the committed one stays valid for signing until revoked — it can't be "revoked", only abandoned):

   ```bash
   cd apps/mobile/android/app
   mv app/debug.keystore app/debug.keystore.old   # keep out of git; destroy after Phase 6
   keytool -genkeypair -v -keystore app/debug.keystore -alias androiddebugkey \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -storepass android -keypass android \
     -dname "CN=Android Debug,O=Android,C=US"
   ```

   - **Debug key has no Play Store impact** (Play uses upload/app-signing keys) — risk is limited to dev/internal builds.
   - **Check Firebase / Google Cloud:** if the debug SHA-1 was registered for dev builds, add the new SHA-1 (`keytool -list -v -keystore app/debug.keystore -alias androiddebugkey -storepass android`).
   - **Tell mobile devs:** existing debug installs won't upgrade over the new signature — uninstall + reinstall once.
   - The new keystore matches `*.keystore` in `.gitignore`; verify with `git status` that it is never staged.
3. Commit the already-staged deletions of both files plus the `.gitignore` rules (Phase 2) so the working tree is clean before the window.

---

## 5. Phase 2 — Freeze & announce (start of window)

Post this message in the team channel **before** starting; nobody pushes during the window:

> **🔒 HISTORY REWRITE FREEZE — [date/time, ~1h]**
> `origin` history is being rewritten to remove `deploy/staging.env` + `debug.keystore` (AUD-05). **Do not push or open PRs** until the follow-up "✅ unfreeze" message. Push or note your current WIP branches now. After the unfreeze, **re-clone** (preferred) — instructions in `docs/GIT-HISTORY-PURGE-PLAN.md` §7.

Pre-flight checklist:

- [ ] All in-flight work pushed or stashed (on **this** machine: the ~155 modified files must survive — see §7 "this machine", use `reset --mixed`, never `--hard`, before rebasing anything)
- [ ] No deploys running / CD paused (CD has approval gates — verify no auto-deploy fires on the force-push; 21 workflows will re-trigger on rewritten pushes)
- [ ] Baseline gitleaks report from Phase 0 saved outside the repo
- [ ] Backup (Phase 3 step 1) verified before any rewrite

---

## 6. Phase 3 — Backup, rewrite, force-push (maintainer only)

**Step 1 — Backup (rollback depends on this):**

```bash
git clone --mirror https://github.com/azeebotv/AzeeboPlus.git /tmp/azeebo-backup.git
cd /tmp/azeebo-backup.git
git bundle create ../azeebo-backup-$(date +%F).bundle --all
git fsck ../azeebo-backup-$(date +%F).bundle      # verify the bundle
cd -
```

Store the bundle on a second machine/location. **Nothing proceeds until `git fsck` passes.**

**Step 2 — Rewrite (on the mirror clone, NOT your working copy):**

```bash
git clone --mirror https://github.com/azeebotv/AzeeboPlus.git /tmp/azeebo-purge.git
cd /tmp/azeebo-purge.git
git filter-repo --invert-paths \
  --path deploy/staging.env \
  --path apps/mobile/android/app/debug.keystore
# Optional hardening (recommended): block reintroduction of the whole class
#   --path-glob '*.keystore' --path-glob '*.env'
# (globs do NOT match .env.example — examples stay in history)
```

Notes:
- `git filter-repo` **removes the `origin` remote** on purpose (safety interlock against accidental pushes) — re-add it next step.
- Every commit from `3699d416` onward gets a new SHA (413 of 586 commits); commits before 2026-07-03 keep their SHAs.

**Step 3 — Force-push all refs:**

```bash
cd /tmp/azeebo-purge.git
git remote add origin https://github.com/azeebotv/AzeeboPlus.git
git push --force origin 'refs/heads/*' 'refs/tags/*'
```

Expect non-fast-forward rejections to be overridden by `--force`; all 10 remote branches and the 1 tag are rewritten.

---

## 7. Team coordination — what every developer does after the unfreeze

**Preferred (no local history to preserve):**

```bash
# save any WIP first!
git -C <repo> stash push -u -m "pre-purge WIP"
rm -rf <repo> && git clone https://github.com/azeebotv/AzeeboPlus.git <repo>
cd <repo> && git checkout Major-Upgrade
git stash pop        # content-based; applies fine across the rewrite
```

**Re-point instead of re-cloning (large repos):**

```bash
git fetch origin
git reset --mixed origin/<your-branch>    # keeps working tree; NEVER --hard here
# for other local branches you no longer need:  git branch -f <name> origin/<name>  (only when clean)
```

**On this machine specifically** (heavy uncommitted work: ~155 modified files + staged deletions): use **`git reset --mixed origin/Major-Upgrade`** only. `--hard` would destroy in-flight work. After the rewrite the two purged files no longer exist in HEAD, so their staged deletions drop out of `git status` automatically; everything else stays as unstaged changes (re-stage as needed).

**Open PRs:**
- Same branch names → GitHub retargets the PR to the rewritten SHAs automatically; expect merge conflicts against the new base and full CI re-runs. Rebase onto the new base (`git rebase origin/<base>`) and force-push your PR branch.
- **Dependabot PRs (4 open):** close and re-open each — Dependabot sometimes stalls on force-pushed bases.
- Old commit SHAs quoted in issues/PR comments will 404 — link to branch/PR instead.

**Tag:** re-fetch tags (`git fetch --tags --force`); anything pinned to the old tag SHA must re-pin.

---

## 8. Phase 5 — GitHub-side residue (the step people forget)

Force-push does **not** immediately erase old objects server-side:

1. **Open a GitHub Support ticket** for `azeebotv/AzeeboPlus` asking for a repository GC / prune of unreachable objects and cache purge — reference that history was intentionally rewritten. Until this runs, old SHAs may still be fetchable by anyone with read access.
2. **Fork audit** (`gh api repos/azeebotv/AzeeboPlus/forks`): every fork carries the full old history. Coordinate: fork owners delete and re-fork, or run the same `filter-repo` procedure on their fork. Confirm the fork list is empty of stale copies afterward.
3. **Local clones/servers:** any CI checkout caches, teammate laptops, or deploy clones keep old objects until they re-clone. Rotate/refresh the checkout used by CI runners if it caches history (workflows using `actions/checkout` with default depth re-fetch on next run — verify).
4. Old bundle/backup from Step 1 is now itself sensitive material — store it encrypted and destroy it after Phase 6 sign-off (keep one encrypted copy until then for rollback).

---

## 9. Phase 6 — Validation (before unfreezing)

```bash
# 1. History no longer contains either path (run from a FRESH clone)
git clone https://github.com/azeebotv/AzeeboPlus.git /tmp/verify-clone && cd /tmp/verify-clone
git log --all --oneline -- deploy/staging.env                 # expect: empty
git log --all --oneline -- apps/mobile/android/app/debug.keystore   # expect: empty
git rev-list --objects --all | grep -E 'staging\.env|debug\.keystore'  # expect: empty

# 2. Full-history secret scan is clean (or only known/false-positive findings)
gitleaks git --redact .

# 3. Repo integrity + CI
git fsck
# → pr-checks green on a scratch PR; security-scanning (gitleaks job) green

# 4. Spot-check rotations
#    - staging secrets rotated & only in the secret manager
#    - new debug keystore present, untracked, Firebase SHA-1 updated (if used)
```

Then post: **"✅ HISTORY REWRITE COMPLETE — re-clone instructions in `docs/GIT-HISTORY-PURGE-PLAN.md` §7"**.

---

## 10. Rollback

If anything breaks before Phase 5 (GitHub GC):

```bash
git push --force /tmp/azeebo-backup.git 'refs/heads/*' 'refs/tags/*'   # restore old history
```

This returns the repo to the pre-purge state (the two files are back in history — i.e., rollback re-opens AUD-05; fix forward instead if validation failed for a minor reason).

---

## 11. Do NOT

- ❌ Run `git filter-repo` against a working copy with uncommitted work (use `--mirror` clones as above)
- ❌ Force-push outside the announced freeze window
- ❌ Use `git reset --hard` on machines with uncommitted work (use `--mixed`)
- ❌ Use `git filter-branch` (deprecated, orders of magnitude slower) or BFG unless the team standardizes on it
- ❌ Skip the backup or the gitleaks baseline "because the values are placeholders" — the keystore is a live artifact
- ❌ Commit, push, or run any of this without explicit maintainer go-ahead — this document is a plan, not a runbook that has been executed
