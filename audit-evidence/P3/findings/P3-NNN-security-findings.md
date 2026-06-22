# Phase 3 — Security Posture (Deployment-Relevant) — Findings (P3-036..P3-042)

> **Owner:** Security
> **Captured at:** 2026-06-22 · SHA `fc01c8c`
> **Evidence on disk:**
> • [audit-evidence/P3/security/_scan.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/security/_scan.txt)
> • [audit-evidence/P3/findings/P3-NNN-security-findings.md](file:///Users/deprof/www/azeebo+/audit-evidence/P3/findings/P3-NNN-security-findings.md) (this file)

---

## P3-036 — 🔴 P0 Critical — No cosign signing in CD; no admission controller enforcing signed images

**Symptom.** `cd.yml` builds and pushes images but never signs them. No `Kyverno` policy or `OPA Gatekeeper` constraint requires `cosign.sigstore.dev/verified: true` on Deployments. An attacker who can push to `ghcr.io/azeebo` (via credential theft) can replace any image.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — supply-chain integrity gap
                            A (Architecture)         — no admission enforcement
```

**Resolution steps.**
1. Add cosign sign step to `cd.yml` (see P3-004 snippet).
2. Install Kyverno in-cluster; add policy to require verified images.

**Snippet.**
```yaml
# infra/k8s/base/kyverno-policies.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-signature
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-cosign
      match:
        resources:
          kinds: ["Pod"]
      verifyImages:
        - imageReferences:
            - "ghcr.io/azeebo/*:*"
          attestors:
            - entries:
                - keys:
                    publicKeys: |-
                      -----BEGIN PUBLIC KEY-----
                      MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
                      -----END PUBLIC KEY-----
```

**Verification checklist.**
- [ ] `kubectl run` with an unsigned image is rejected by Kyverno.
- [ ] CI-built image passes cosign verify.

---

## P3-037 — 🔴 P0 Critical — No PodSecurityStandards enforcement at namespace level

**Symptom.** `infra/k8s/base/namespace.yaml` does not label the namespace with `pod-security.kubernetes.io/enforce: restricted`. The audit-policy is defined but no enforcement at admission time.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — workload hardening optional
                            A (Architecture)         — defence-in-depth missing
```

**Resolution steps.**
1. Add the PSS labels to `azeebo` and `azeebo-monitoring` namespaces.
2. Run the `kube-bench` / `kube-hunter` report.

**Snippet.**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: azeebo
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**Verification checklist.**
- [ ] `kubectl label --dry-run ns azeebo pod-security.kubernetes.io/enforce=restricted` accepted.
- [ ] Pod that requests privileged is denied by the API server.

---

## P3-038 — 🟠 P1 High — ZAP scan config missing OWASP API Top 10 rules

**Symptom.** `infra/security/zap-config.yaml` is a 90-rule subset. Rules 10104, 10105, 10106 (API-specific: Improper Asset Management, Insufficient Logging & Monitoring) are absent. ZAP run only happens on `schedule` or `main` push — not on every PR.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — API Top-10 coverage gap
                            E (Engineering Quality)   — pre-merge DAST missing
```

**Resolution steps.**
1. Add `zaproxy/action-api-scan` to `pr-checks.yml` targeting a deployed PR environment.
2. Extend `zap-config.yaml` to include `10104..10106` + `10202` (Broken Authentication) + `10203` (Broken Object Property Level Authorization).

**Snippet.**
```yaml
- uses: zaproxy/action-api-scan@v0.4.0
  with:
    target: https://pr-${{ github.event.number }}.pr.azeebo.com
    rules_file_name: infra/security/zap-config.yaml
    fail_action: true
```

**Verification checklist.**
- [ ] PR with a known OWASP API vuln fails ZAP.
- [ ] `zap-config.yaml` lists ≥ 100 rules.

---

## P3-039 — 🟠 P1 High — Secret rotation cadence 90 d, no recorded last-rotation date

**Symptom.** `scripts/secret-rotation.sh` runs at `cron: '0 3 1 * *'` (monthly), but the script's `ROTATION_INTERVAL_DAYS=90` flag and the absence of any "last rotated" timestamp mean rotation can silently fail and nobody notices.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — credential lifetime unbounded
                            E (Engineering Quality)   — no audit trail
```

**Resolution steps.**
1. Record `last_rotated_at` per secret in AWS Secrets Manager tags.
2. Add a Prometheus alert: `time() - secretsmanager_last_rotated > 86400 * 80`.

**Snippet.**
```bash
# scripts/secret-rotation.sh
aws secretsmanager tag-resource \
  --secret-id "$SECRET_ID" \
  --tags '[{"Key":"last_rotated_at","Value":"'"$(date -Iseconds)"'"}]'
```

**Verification checklist.**
- [ ] After next scheduled run, every secret has a `last_rotated_at` tag.
- [ ] Alert fires when 80 days pass without rotation.

---

## P3-040 — 🟠 P1 High — No mTLS / service-mesh posture

**Symptom.** Service-to-service traffic between `auth-service`, `wallet-service`, `payment-service`, etc. is plaintext HTTP inside the cluster. `NetworkPolicy` covers L4 but does not enforce L7 identity.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — zero-trust posture not implemented
                            A (Architecture)         — east-west traffic unauthenticated
```

**Resolution steps.**
1. Install Istio or Linkerd control plane.
2. Annotate namespace: `istio-injection: enabled`.
3. Define `AuthorizationPolicy` for each service-to-service edge.

**Snippet.**
```yaml
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: payment-service-only-from-wallet
  namespace: azeebo
spec:
  selector:
    matchLabels:
      app: payment-service
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/azeebo/sa/wallet-service"]
      to:
        - operation:
            methods: ["POST"]
            paths: ["/v1/payments/charge"]
```

**Verification checklist.**
- [ ] Sidecar injected in every pod; mTLS `STRICT`.
- [ ] Cross-service calls without AuthorizationPolicy fail.

---

## P3-041 — 🟡 P2 Medium — Egress filtering not enforced

**Symptom.** `infra/k8s/base/network-policies.yaml` allows egress only to specific services + DNS. But no NetworkPolicy restricts egress to external IPs (e.g. Paystack API). A compromised pod can exfiltrate to arbitrary internet destinations.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — egress unrestricted
                            A (Architecture)         — no allow-list for outbound
```

**Resolution steps.**
1. Define an `ExternalDestination` allow-list (Paystack, Flutterwave, SendGrid, Twilio, Firebase, AWS S3).
2. Use a Cilium `CiliumNetworkPolicy` or Istio `ServiceEntry` to enforce.

**Snippet.**
```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-payment-egress
  namespace: azeebo
spec:
  endpointSelector:
    matchLabels:
      app: payment-service
  egress:
    - toFQDNs:
        - matchName: api.paystack.co
        - matchName: api.flutterwave.com
      toPorts:
        - ports: [{ port: "443", protocol: "TCP" }]
    - toEntities: ["world"]
      toPorts:
        - ports: [{ port: "53", protocol: "UDP" }]
```

**Verification checklist.**
- [ ] Compromised pod cannot reach a non-allow-listed FQDN.
- [ ] Payment service reaches Paystack/Flutterwave without regression.

---

## P3-042 — 🟢 P3 Low — No runtime threat detection (Falco/Tetragon) deployed

**Symptom.** No Falco/Tetragon DaemonSet, no `kube-prometheus-stack` rule for anomalous syscalls. A reverse-shell from a compromised pod would not trigger an alert.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — runtime detection absent
                            L (Latency)              — incident dwell time
```

**Resolution steps.**
1. Add a Falco DaemonSet via Helm chart.
2. Custom rule: `spawn_process` in a non-shell binary path → alert.

**Snippet.**
```yaml
customRules:
  rule-shell-in-container:
    condition: >-
      spawned_process and container and
      proc.name in (bash, sh, zsh, ksh, csh, fish)
    output: shell-spawned-in-container
    priority: WARNING
```

**Verification checklist.**
- [ ] `kubectl exec -it <pod> -- bash` triggers a Falco alert.
- [ ] Slack notification fires within 5 s.