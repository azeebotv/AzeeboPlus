# Archive

Legacy/unused infrastructure kept for reference only. Nothing in this
directory is wired into CI/CD or expected to build.

- `k8s-legacy/` — the original hand-rolled Kubernetes manifests. Superseded by
  `infra/k8s/` (hardened `securityContext`, overlays, PDBs, resource limits).
  Do not extend; deploy from `infra/k8s/`. Secrets are provisioned via the
  External Secrets Operator (`base/external-secret.yaml`), never committed.
