# Phase 3 — Kubernetes Manifest Hardening — Findings (P3-014..P3-020)

> **Owner:** DevOps/SRE
> **Captured at:** 2026-06-22 · SHA `fc01c8c`
> **Evidence on disk:**
> • [audit-evidence/P3/k8s/_scan.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/k8s/_scan.txt)
> • [audit-evidence/P3/k8s/_pdbs.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/k8s/_pdbs.txt)
> • [audit-evidence/P3/k8s/_netpol.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/k8s/_netpol.txt)
> • [audit-evidence/P3/k8s/_secrets-rg.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/k8s/_secrets-rg.txt)
> • [audit-evidence/P3/findings/P3-NNN-k8s-findings.md](file:///Users/deprof/www/azeebo+/audit-evidence/P3/findings/P3-NNN-k8s-findings.md) (this file)

---

## P3-014 — 🟠 P1 High — 7 services missing PodDisruptionBudget

**Symptom.** Per `infra/k8s/base/pod-disruption-budgets.yaml` audit: `games-service`, `moderation-service`, `movie-service`, `queue-service`, `sports-service`, `support-service`, `vertical-service` have no PDB.

**Root-cause framing.**
```
FABLE 5 pillars violated:  B (Brevity) — voluntary disruption (node upgrade) can drop to 0 replicas
                            A (Architecture) — no quorum protection on critical paths
```

**Resolution steps.**
1. Add a PDB for each missing service.
2. Choose `minAvailable: 1` for non-critical (`games`, `sports`, `movie`), `maxUnavailable: 1` for `queue`, `moderation`, `support`.

**Snippet.**
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: games-service-pdb
  namespace: azeebo
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: games-service
```

**Verification checklist.**
- [ ] `kubectl get pdb -n azeebo` lists 22 PDBs (one per service).
- [ ] `kubectl drain` of a node does not take a service below its `minAvailable`.

---

## P3-015 — 🟠 P1 High — No default-deny NetworkPolicy in `azeebo` namespace

**Symptom.** `infra/k8s/base/network-policies.yaml` defines explicit ingress+egress for only 5 services (auth, user, wallet, payment, api-gateway). The remaining 18 services have no NetworkPolicy at all, and there is no `default-deny-all` rule.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — east-west traffic unrestricted
                            A (Architecture)         — implicit allow, violates zero-trust
```

**Resolution steps.**
1. Add a `kube-system`-style default-deny.
2. Audit each service's required in/out flows; convert to explicit allow.

**Snippet.**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: azeebo
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```

**Verification checklist.**
- [ ] `kubectl auth can-i list pods --as=system:serviceaccount:default:default` in staging returns "no" for any cross-service call.
- [ ] All existing functional traffic continues to work (smoke tests pass).

---

## P3-016 — 🟠 P1 High — Plaintext secrets YAML checked in

**Symptom.** `infra/k8s/secrets.yaml` is a literal `kind: Secret` manifest with `data:` fields (empty placeholders, but the file is committed). `secret-verification.sh` may not flag it because values are empty strings.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — even empty Secret manifests create GitOps attack surface
                            A (Architecture)         — secrets should live in ESO + git-crypt, not raw YAML
```

**Resolution steps.**
1. Delete `infra/k8s/secrets.yaml` (placeholder; never real values).
2. Add `.gitignore` rule for `infra/k8s/**/secrets.yaml` (except `*.example.yaml`).
3. Rely exclusively on `infra/k8s/base/external-secrets.yaml` (AWS + GCP SecretStore).

**Verification checklist.**
- [ ] `git ls-files infra/k8s/secrets.yaml` returns nothing.
- [ ] Only `secrets.example.yaml` exists under `infra/k8s/`.

---

## P3-017 — 🟠 P1 High — Top-level `infra/k8s/api-gateway.yaml` and `web-app.yaml` not kustomized into `base/`

**Symptom.** Two deployments exist at the top of `infra/k8s/` rather than under `base/`. The `production/kustomization.yaml` includes `../base/api-gateway.yaml` (kustomized) AND there's a duplicate at the root. Staging has no parallel.

**Root-cause framing.**
```
FABLE 5 pillars violated:  A (Architecture) — drift between root-level and base-level manifests
                            E (Engineering Quality) — kustomization not the single source of truth
```

**Resolution steps.**
1. Move `infra/k8s/api-gateway.yaml` and `infra/k8s/web-app.yaml` into `infra/k8s/base/`.
2. Update both `production/kustomization.yaml` and `staging/kustomization.yaml` to reference the base path.

**Snippet.**
```bash
git mv infra/k8s/api-gateway.yaml infra/k8s/base/api-gateway.yaml
git mv infra/k8s/web-app.yaml     infra/k8s/base/web-app.yaml
```

**Verification checklist.**
- [ ] `find infra/k8s -maxdepth 1 -name "*.yaml"` returns no Deployments.
- [ ] `kustomize build infra/k8s/production` succeeds; output identical to pre-move.

---

## P3-018 — 🟡 P2 Medium — CORS allow-origin in ingress only lists `app.azeebo.com`

**Symptom.** `infra/k8s/base/ingress.yaml`:
```
nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.azeebo.com"
```
But the mobile app and `creator.azeebo.com` make cross-origin requests against `api.azeebo.com`.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — overly narrow CORS whitelisting
                            A (Architecture)         — single-origin assumption
```

**Resolution steps.**
1. Switch `cors-allow-origin` to a regex (`https://(app|creator|admin)\\.azeebo\\.com`).
2. Add `cors-allow-credentials: "true"` (the API uses cookies for refresh).

**Snippet.**
```yaml
nginx.ingress.kubernetes.io/cors-allow-origin: "https://(app|creator|admin)\\.azeebo\\.com"
nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
```

**Verification checklist.**
- [ ] `curl -H 'Origin: https://creator.azeebo.com' -I https://api.azeebo.com/v1/…` returns `Access-Control-Allow-Origin` header.
- [ ] Mobile deep-link login flow from the mobile webview succeeds.

---

## P3-019 — 🟡 P2 Medium — Postgres `infra/k8s/postgres.yaml` is single-replica, not HA

**Symptom.** Top-level `infra/k8s/postgres.yaml` defines a single-replica Deployment with `postgres:15-alpine`, 10Gi PVC, no replication. Meanwhile `infra/k8s/base/postgres-ha.yaml` defines a Zalando Spilo HA cluster. Two parallel stacks exist.

**Root-cause framing.**
```
FABLE 5 pillars violated:  B (Brevity) — HA cluster ignored, single-point-of-failure present
                            A (Architecture) — two parallel database deployment paths
```

**Resolution steps.**
1. Delete `infra/k8s/postgres.yaml`.
2. Add `infra/k8s/base/postgres-ha.yaml` to both `production/kustomization.yaml` and `staging/kustomization.yaml`.

**Snippet.**
```yaml
# production/kustomization.yaml
resources:
  - namespace.yaml
  - ../base/postgres-ha.yaml   # ← add
```

**Verification checklist.**
- [ ] `kubectl get postgresql -n azeebo` shows the Spilo cluster.
- [ ] Patroni failover test (kill primary) completes within 30 s.

---

## P3-020 — 🟢 P3 Low — `topologySpreadConstraints` not set

**Symptom.** `service-template.yaml` has `podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution` but no `topologySpreadConstraints`. Multi-zone HA is left to chance.

**Root-cause framing.**
```
FABLE 5 pillars violated:  B (Brevity) — uneven replica distribution
                            L (Latency)  — tail-latency variance during zone failure
```

**Resolution steps.**
1. Add a zone-spread constraint per deployment.

**Snippet.**
```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: SERVICE_NAME
```

**Verification checklist.**
- [ ] Replicas evenly distributed across `us-east-1a/b/c`.
- [ ] Zone failure leaves ≥ 50% of replicas.