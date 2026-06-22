# Phase 3 — Staging ↔ Production Parity — Findings (P3-021..P3-025)

> **Owner:** DevOps/SRE
> **Captured at:** 2026-06-22 · SHA `fc01c8c`
> **Evidence on disk:**
> • [audit-evidence/P3/parity/staging-vs-prod.diff](file:///Users/deprof/www/azeebo+/audit-evidence/P3/parity/staging-vs-prod.diff)
> • [audit-evidence/P3/findings/P3-NNN-parity-findings.md](file:///Users/deprof/www/azeebo+/audit-evidence/P3/findings/P3-NNN-parity-findings.md) (this file)

---

## P3-021 — 🟠 P1 High — Staging does not inherit from `infra/k8s/base/`

**Symptom.** `infra/k8s/staging/kustomization.yaml` re-declares every service Deployment locally rather than referencing `../base/<svc>.yaml`. Two parallel truth sources for the same workload definitions.

**Root-cause framing.**
```
FABLE 5 pillars violated:  A (Architecture)         — single source of truth violated
                            E (Engineering Quality) — drift will recur on every PR
```

**Resolution steps.**
1. Replace each `staging/<svc>.yaml` with `../base/<svc>.yaml` in `staging/kustomization.yaml`.
2. Use `patchesStrategicMerge` to override only the values that legitimately differ (e.g. `replicas`, `LOG_LEVEL`).

**Snippet.**
```yaml
# staging/kustomization.yaml
resources:
  - namespace.yaml
  - ../base/postgres-ha.yaml
  - ../base/redis.yaml
  - ../base/auth-service.yaml
  - ../base/user-service.yaml
  …
patchesStrategicMerge:
  - auth-service-staging-patch.yaml
```

```yaml
# auth-service-staging-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: auth-service
          env:
            - name: NODE_ENV
              value: staging
            - name: LOG_LEVEL
              value: debug
```

**Verification checklist.**
- [ ] `kustomize build infra/k8s/staging` produces the same Deployment as `kustomize build infra/k8s/base` plus the patch overlay.
- [ ] A change to `base/auth-service.yaml` propagates to staging on the next apply.

---

## P3-022 — 🟠 P1 High — Production ExternalSecret surface is incomplete

**Symptom.** `infra/k8s/base/external-secrets.yaml` materialises only 7 keys (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, JWT_REFRESH_SECRET, PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY). Staging requires 16 keys (SENDGRID_API_KEY, TWILIO_*, FIREBASE_SERVER_KEY, AWS_*, etc.).

**Root-cause framing.**
```
FABLE 5 pillars violated:  A (Architecture) — secret surface drift
                            F (Foundational Security) — pods may fail or fall back to defaults
```

**Resolution steps.**
1. Add ExternalSecret definitions for SENDGRID, TWILIO, FIREBASE, AWS_ACCESS_KEY_ID/SECRET, AWS_S3_BUCKET.
2. Mark each key as `optional: true` if the service tolerates missing values.

**Snippet.**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: azeebo-notification-keys
  namespace: azeebo
spec:
  refreshInterval: "1h"
  secretStoreRef: { name: aws-secrets-manager, kind: SecretStore }
  target:
    name: azeebo-secrets
    creationPolicy: Owner
  data:
    - secretKey: SENDGRID_API_KEY
      remoteRef: { key: /azeebo-plus/notifications/sendgrid }
    - secretKey: TWILIO_ACCOUNT_SID
      remoteRef: { key: /azeebo-plus/notifications/twilio-sid }
    - secretKey: TWILIO_AUTH_TOKEN
      remoteRef: { key: /azeebo-plus/notifications/twilio-token }
    - secretKey: FIREBASE_SERVER_KEY
      remoteRef: { key: /azeebo-plus/notifications/firebase }
```

**Verification checklist.**
- [ ] `kubectl get secret azeebo-secrets -n azeebo -o yaml` lists every required key.
- [ ] Notification service boots without `optional: true` fallbacks.

---

## P3-023 — 🟡 P2 Medium — `production/kustomization.yaml` patch is a no-op

**Symptom.** `production/kustomization.yaml` contains a `patchesStrategicMerge` setting `auth-service.spec.replicas=3`, but `base/auth-service.yaml` already declares `replicas: 3`.

**Root-cause framing.**
```
FABLE 5 pillars violated:  E (Engineering Quality) — silent override on future change
                            B (Brevity)             — confusing artefact
```

**Resolution steps.**
1. Remove the patch. If the intent was to declare a prod-specific replica count, change `base/auth-service.yaml` to use `replicas: 3` directly (or parameterise via kustomize `replicas:` transformer).

**Snippet.**
```diff
- patchesStrategicMerge:
-   - |-
-     apiVersion: apps/v1
-     kind: Deployment
-     metadata:
-       name: auth-service
-     spec:
-       replicas: 3
```

**Verification checklist.**
- [ ] `kustomize build infra/k8s/production | grep -A1 "name: auth-service"` shows no patch overlay.

---

## P3-024 — 🟡 P2 Medium — `staging/postgres.yaml` is single-replica, not HA

**Symptom.** Staging uses its own 1-replica postgres Deployment with 10Gi PVC. Production references `base/postgres-ha.yaml` (Spilo, 3 replicas, 500Gi). Different topology → different performance/lock behaviour.

**Root-cause framing.**
```
FABLE 5 pillars violated:  B (Brevity) — staging won't reproduce prod lock issues
                            E (Engineering Quality) — parity gap hides bugs
```

**Resolution steps.**
1. Add `../base/postgres-ha.yaml` to `staging/kustomization.yaml` with a `replicas:` transformer set to 1.
2. Reduce `volume.size` via patch.

**Snippet.**
```yaml
# staging/kustomization.yaml
resources:
  - ../base/postgres-ha.yaml
  # …
patchesStrategicMerge:
  - postgres-staging-patch.yaml
```

```yaml
# postgres-staging-patch.yaml
apiVersion: acid.zalan.do/v1
kind: postgresql
metadata:
  name: azeebo-postgres-ha
spec:
  numberOfInstances: 1
  patroni: { synchronous_mode: false }
  volume: { size: 50Gi, storageClass: gp3 }
```

**Verification checklist.**
- [ ] `kustomize build infra/k8s/staging` produces a Spilo manifest.
- [ ] Staging pod boots Patroni single-node.

---

## P3-025 — 🟢 P3 Low — No Conftest/OPA policy enforces parity

**Symptom.** No `policy/policy.yaml`, no `conftest` step in `ci.yml`. Parity drift is not blocked at PR time.

**Root-cause framing.**
```
FABLE 5 pillars violated:  E (Engineering Quality) — manual review only
                            A (Architecture)         — drift prevention missing
```

**Resolution steps.**
1. Add `policy/lib/*.rego` covering: same replica count between staging/prod, same resource limits, no plaintext secrets in non-example files.
2. Add `conftest test policy/` to `ci.yml`.

**Snippet.**
```rego
# policy/parity.rego
package main
deny[msg] {
  input.kind == "Deployment"
  input.metadata.namespace == "azeebo-staging"
  not input.spec.template.spec.containers[_].securityContext.runAsNonRoot
  msg := sprintf("staging Deployment %v missing runAsNonRoot", [input.metadata.name])
}
```

**Verification checklist.**
- [ ] `conftest test infra/k8s/staging/` passes.
- [ ] `conftest test infra/k8s/production/` passes.
- [ ] PR introducing a SecurityContext regression fails the policy check.