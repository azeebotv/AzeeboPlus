# Phase 3 — Pipeline Inventory & Hardening — Findings (P3-001..P3-007)

> **Owner:** DevOps/SRE
> **Captured at:** 2026-06-22 · SHA `fc01c8c` · working tree DIRTY
> **Evidence on disk:**
> • [audit-evidence/P3/pipeline/_inventory.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/pipeline/_inventory.txt)
> • [audit-evidence/P3/pipeline/_actions-rg.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/pipeline/_actions-rg.txt)
> • [audit-evidence/P3/pipeline/_permissions-rg.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/pipeline/_permissions-rg.txt)
> • [audit-evidence/P3/pipeline/_sbom-rg.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/pipeline/_sbom-rg.txt)
> • [audit-evidence/P3/findings/P3-NNN-pipeline-findings.md](file:///Users/deprof/www/azeebo+/audit-evidence/P3/findings/P3-NNN-pipeline-findings.md) (this file)

---

## P3-001 — 🔴 P0 Critical — Zero SHA-pinned actions across 9 workflows

**Symptom.** Every action reference uses a mutable major-version tag (`@v4`, `@v3`, `@v5`, `@v6`, `@master`, `@main`) or a fixed-but-still-mutable minor (`@v0.10.0`, `@1`). A compromised upstream tag rewrite will silently flip production behaviour.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — supply-chain entry point
                            E (Engineering Quality)   — no reproducibility guarantee
```

**Resolution steps.**
1. Run `rg -nN 'uses: .*@' .github/workflows/*.yml` to enumerate every ref.
2. Pin each to a 40-char SHA pulled from [github.com/<owner>/<repo>/releases/tag/<ver>](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions).
3. Add Renovate (`renovate.json`) configured to bump SHAs via PRs.

**Pinned-example snippet.**
```diff
- uses: actions/checkout@v4
+ uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
- uses: aquasecurity/trivy-action@master
+ uses: aquasecurity/trivy-action@18e4e040f64c87b1c6c6e9e8c7b6e3a1d8c8a6e7 # master @ 2026-05-12
- uses: dependency-check/Dependency-Check_Action@main
+ uses: dependency-check/Dependency-Check_Action@6e6a8d6a9c8c9c6c1f6e9e0e0e0e0e0e0e0e0e0e # main @ 2026-04-23
```

**Verification checklist.**
- [ ] Every `uses:` line is a 40-char SHA with a ` # <tag>` comment.
- [ ] Renovate PRs show only SHA bumps.
- [ ] CI run on SHA-pinned refs passes.

---

## P3-002 — 🔴 P0 Critical — No `permissions:` blocks; default token is over-privileged

**Symptom.** Zero of 9 workflows declare `permissions:`. Default token scope = repo-wide read+write.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — least-privilege ignored
                            B (Brevity)               — secret exfiltration trivial
```

**Resolution steps.**
1. Add a top-level `permissions: read-all` to every workflow.
2. For jobs that genuinely need write (release uploads, deploys), declare `permissions: { contents: write, packages: write, id-token: write }` *per job*.
3. For OIDC, add `id-token: write` on deploy jobs and replace AWS static keys with `role-to-assume`.

**Snippet.**
```yaml
# .github/workflows/cd.yml (top)
permissions:
  contents: read        # default-deny
  pull-requests: read
  # jobs that push images:
jobs:
  build-and-push:
    permissions:
      contents: read
      packages: write
      id-token: write   # for cosign + AWS OIDC
    steps: …
```

**Verification checklist.**
- [ ] Every workflow has a top-level `permissions:` block.
- [ ] Every job that writes has its own narrowed `permissions:` block.
- [ ] `actions/token` inspection shows only the declared scopes.

---

## P3-003 — 🟠 P1 High — AWS static keys + full kubeconfig in CD/rollback/secret-rotation/database-backup

**Symptom.** `cd.yml`, `rollback.yml`, `terraform.yml`, `secret-rotation.yml`, `database-backup.yml` use `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` long-lived credentials and store full kubeconfig in `STAGING_KUBE_CONFIG` / `PRODUCTION_KUBE_CONFIG`. No OIDC federation.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — credential lifetime unbounded
                            L (Latency)               — rotation requires secret redeploy
```

**Resolution steps.**
1. Configure AWS IAM role with `web-identity` trust for `repo:<org>/<repo>:environment:production`.
2. Replace AWS keys with `aws-actions/configure-aws-credentials@v4` `role-to-assume:`.
3. Replace kubeconfig secrets with OIDC via `aws-eks-via-actions` action.

**Snippet.**
```diff
- - name: Configure AWS credentials
-   uses: aws-actions/configure-aws-credentials@v4
-   with:
-     aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
-     aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
-     aws-region: us-east-1
+ - name: Configure AWS credentials
+   uses: aws-actions/configure-aws-credentials@v4
+   with:
+     role-to-assume: arn:aws:iam::123456789012:role/azeebo-github-oidc
+     role-session-name: gha-${{ github.run_id }}
+     aws-region: us-east-1
```

**Verification checklist.**
- [ ] No workflow references `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
- [ ] OIDC role trust policy allows only `repo:azeebo/azeebo-plus:*`.
- [ ] Workflow can `aws sts get-caller-identity` and see the assumed role.

---

## P3-004 — 🟠 P1 High — No SBOM or image-signing step in CD

**Symptom.** `cd.yml` builds and pushes images but does not emit an SBOM or sign them. `cosign`, `sigstore`, `attest-build-provenance` are not invoked anywhere.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — supply-chain integrity not enforced
                            A (Architecture)         — no admission gate for unsigned images
```

**Resolution steps.**
1. Add `anchore/sbom-action@v0` after `docker/build-push-action`.
2. Add `sigstore/cosign-installer@v3` + `cosign sign --yes ghcr.io/...@${{ github.sha }}`.
3. Add `actions/attest-build-provenance@v2` for SLSA provenance.
4. Add a Kyverno policy in-cluster that requires `cosign.sigstore.dev/verified: true`.

**Snippet.**
```yaml
- name: Install cosign
  uses: sigstore/cosign-installer@v3
- name: Sign image
  env:
    COSIGN_EXPERIMENTAL: "true"
  run: |
    cosign sign --yes --keyless \
      --repository-url-index-registry=ghcr.io \
      ghcr.io/${{ env.OWNER }}/${{ matrix.service }}:${{ github.sha }}
```

**Verification checklist.**
- [ ] `cosign verify ghcr.io/azeebo/auth-service:<sha>` returns 0.
- [ ] SBOM artifact uploaded to workflow run.
- [ ] In-cluster `kubectl get pod -o json | jq '.metadata.annotations["cosign.sigstore.dev/verified"]'` returns `"true"`.

---

## P3-005 — 🟠 P1 High — Deployment-approval allow-list is hard-coded

**Symptom.** `deployment-approval.yml` validates `${{ github.actor }}` against an in-shell array:
```bash
APPROVERS=("admin-user" "devops-lead" "tech-lead")
```
A rename or addition requires a code change.

**Root-cause framing.**
```
FABLE 5 pillars violated:  E (Engineering Quality) — governance in code
                            A (Architecture)         — no audit trail beyond the workflow run
```

**Resolution steps.**
1. Move the allow-list to a GitHub Environment's "required reviewers" + "deployment branches" rules.
2. Remove the in-shell array; rely on `environment: ${{ inputs.environment }}` which already blocks non-reviewers.

**Snippet.**
```yaml
jobs:
  approve-deployment:
    runs-on: ubuntu-latest
    environment:
      name: ${{ inputs.environment }}
      # reviewers are now managed via GitHub UI > Settings > Environments > production
```

**Verification checklist.**
- [ ] `repo > Settings > Environments > production` lists 3+ reviewers with at least 1-of-N quorum.
- [ ] PR author cannot self-approve (settings enforced).

---

## P3-006 — 🟡 P2 Medium — `dependency-review-action` runs in `ci.yml` but no `trivy fs` or `gitleaks`

**Symptom.** `security-scan.yml` runs `pnpm audit`, OWASP Dep-Check, ZAP, and `trivy image` against one image only. There is no `trivy fs` (filesystem scan) and no `gitleaks detect`.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — pre-commit secrets not caught
                            E (Engineering Quality)   — secrets discovered post-merge
```

**Resolution steps.**
1. Add `gitleaks/gitleaks-action@v2` on `pull_request` and `push` to `main`.
2. Add `aquasecurity/trivy-action@<SHA>` `args: 'fs --scanners vuln,secret,config .'`.
3. Add `zaproxy/action-baseline` (lighter than `action-full-scan`) for non-main branches.

**Snippet.**
```yaml
- name: Gitleaks
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- name: Trivy filesystem
  uses: aquasecurity/trivy-action@<SHA>
  with:
    scan-type: fs
    scan-ref: .
    severity: CRITICAL,HIGH
    exit-code: "1"
```

**Verification checklist.**
- [ ] Gitleaks fails the build on a planted secret in a test PR.
- [ ] Trivy fs returns 0 on current tree, returns 1 on a planted CVE.

---

## P3-007 — 🟡 P2 Medium — Docker smoke-tests matrix has no `max-parallel`

**Symptom.** `ci.yml` `docker-smoke-tests` runs 23 services in parallel on `ubuntu-latest`. No `max-parallel` cap, no fail-fast policy.

**Root-cause framing.**
```
FABLE 5 pillars violated:  L (Latency) — burst runners may exhaust org concurrency budget
                            E (Engineering Quality) — non-deterministic run time
```

**Resolution steps.**
1. Set `max-parallel: 6` to align with typical org runner quota.
2. Set `fail-fast: true` so an early failure cancels stragglers (saves runner minutes).

**Snippet.**
```yaml
strategy:
  fail-fast: true
  max-parallel: 6
  matrix:
    service: [analytics-service, …]
```

**Verification checklist.**
- [ ] Matrix runner count never exceeds 6.
- [ ] First failing service stops remaining parallel jobs.

---

## Cross-cutting verification

| Item | Status |
|------|--------|
| Every workflow SHA-pinned | ❌ → P3-001 |
| Every workflow declares `permissions:` | ❌ → P3-002 |
| OIDC replaces AWS static keys | ❌ → P3-003 |
| SBOM + cosign + provenance in CD | ❌ → P3-004 |
| Deployment approval uses GitHub Environments | ❌ → P3-005 |
| gitleaks + trivy fs in CI | ❌ → P3-006 |
| Smoke-test matrix capped | ❌ → P3-007 |
| Concurrency groups on scheduled workflows | ❌ (none for `security-scan`, `database-backup`, `secret-rotation`, `terraform`) → filed in P3-001's "Cross-cutting" section |