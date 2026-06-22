# Phase 3 — Observability & SLO Review — Findings (P3-026..P3-030)

> **Owner:** SRE
> **Captured at:** 2026-06-22 · SHA `fc01c8c`
> **Evidence on disk:**
> • [audit-evidence/P3/observability/_scan.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/observability/_scan.txt)
> • [audit-evidence/P3/findings/P3-NNN-observability-findings.md](file:///Users/deprof/www/azeebo+/audit-evidence/P3/findings/P3-NNN-observability-findings.md) (this file)

---

## P3-026 — 🔴 P0 Critical — `packages/opentelemetry` is an empty stub

**Symptom.** `packages/opentelemetry/src/index.ts` is 1 line (a placeholder). The package is imported by services expecting SDK initialization, but no SDK is configured. → **No traces, no metrics, no logs** from any service.

**Root-cause framing.**
```
FABLE 5 pillars violated:  A (Architecture)         — observability pipeline missing
                            L (Latency)              — incidents undebuggable
                            E (Engineering Quality)  — SLO measurement impossible
```

**Resolution steps.**
1. Implement SDK initialization in `packages/opentelemetry/src/index.ts`:
   - Tracer: OTLP/HTTP exporter, tail-based sampling.
   - Meter: OTLP metrics, periodic 60s.
   - Logger: Pino → OTLP bridge.
2. Add `auto-instrumentations-node` for HTTP, Prisma, Redis, etc.
3. Wire `NodeSDK.start()` in `services/<svc>/src/main.ts` before NestJS bootstrap.

**Snippet.**
```typescript
// packages/opentelemetry/src/index.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export const otelSDK = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces' }),
  metricExporter: new OTLPMetricExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics' }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },
  })],
});

export function startOtel() {
  otelSDK.start();
  process.on('SIGTERM', () => otelSDK.shutdown().catch(console.error));
}
```

```typescript
// services/<svc>/src/main.ts
import { startOtel } from '@azeebo/opentelemetry';
startOtel();
// …then NestJS bootstrap…
```

**Verification checklist.**
- [ ] Traces from a test request appear in Jaeger/Tempo.
- [ ] Metrics (http_server_duration, db_client_op_duration) appear in Prometheus.
- [ ] `SIGTERM` triggers `OTEL_SDK.shutdown` before exit.

---

## P3-027 — 🟠 P1 High — Zero SLO definitions

**Symptom.** No `slo.yaml`, no SLO annotations on services, no Prometheus recording rules for SLI/SLO. The error-rate alerts in `prometheus-alerts.yaml` are simple thresholds without availability/latency budgets.

**Root-cause framing.**
```
FABLE 5 pillars violated:  L (Latency) — on-call prioritisation impossible
                            B (Brevity) — no error budget management
```

**Resolution steps.**
1. Add per-service SLO definitions in `infra/k8s/monitoring/slo.yaml`.
2. Add multi-window burn-rate alerts (Google SRE workbook).

**Snippet.**
```yaml
# infra/k8s/monitoring/slo.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-definitions
  namespace: azeebo-monitoring
data:
  auth-service.yaml: |
    service: auth-service
    slos:
      - name: availability
        sli:
          ratio:
            numerator:   http_requests_total{service="auth-service",code=~"2..|3.."}
              denominator: http_requests_total{service="auth-service"}
        objective: 99.95
      - name: latency
        sli:
          histogram:
            selector: http_request_duration_seconds_bucket{service="auth-service"}
            threshold: 0.5
        objective: 99
```

**Verification checklist.**
- [ ] `sloth generate` produces Prometheus rules for every service.
- [ ] Burn-rate alert fires in a load test that exceeds 2× budget.

---

## P3-028 — 🟠 P1 High — Grafana dashboards absent

**Symptom.** `infra/k8s/monitoring/grafana.yaml` exists, but no ConfigMap-based dashboards, no `grafana-dashboard-*` provisions, no `infra/k8s/monitoring/dashboards/` directory.

**Root-cause framing.**
```
FABLE 5 pillars violated:  L (Latency) — incidents require ad-hoc query building
                            A (Architecture) — observability surface incomplete
```

**Resolution steps.**
1. Author a `dashboards/auth-service.json`, `dashboards/wallet-service.json`, `dashboards/overview.json` for RED + USE.
2. Add a `ConfigMap` per dashboard; mount as sidecar in Grafana deployment.

**Snippet.**
```bash
# scripts/dashboards-provision.sh
for d in dashboards/*.json; do
  kubectl -n azeebo-monitoring create cm grafana-dashboard-$(basename "$d" .json) --from-file="$d"
done
```

```yaml
# grafana deployment patch
spec:
  template:
    spec:
      containers:
        - name: grafana
          volumeMounts:
            - name: dashboards
              mountPath: /var/lib/grafana/dashboards
      volumes:
        - name: dashboards
          configMap:
            name: grafana-dashboards-provision
            items:
              - key: dashboards.yaml
                path: dashboards.yaml
```

**Verification checklist.**
- [ ] Grafana lists every service dashboard on first login.
- [ ] Service overview dashboard surfaces SLO burn rate.

---

## P3-029 — 🟡 P2 Medium — Prometheus scrape interval not aggressive for auth

**Symptom.** `infra/k8s/monitoring/prometheus.yaml` `scrape_interval: 15s`. Auth-service login failures spike faster than 15s; alerts in `prometheus-alerts.yaml` `for: 2m` allow the spike to subside before paging.

**Root-cause framing.**
```
FABLE 5 pillars violated:  L (Latency) — alerting lag during brute-force
                            F (Foundational Security) — detection window too wide
```

**Resolution steps.**
1. Lower `scrape_interval: 5s` for the auth-service ServiceMonitor.
2. Lower alert `for:` clause to `30s` for `HighAuthFailureRate`.

**Snippet.**
```yaml
# infra/k8s/monitoring/prometheus.yaml
scrape_configs:
  - job_name: 'auth-service'
    scrape_interval: 5s
    static_configs:
      - targets: ['auth-service.azeebo.svc.cluster.local:3000']
```

```yaml
# infra/k8s/monitoring/prometheus-alerts.yaml
- alert: HighAuthFailureRate
  expr: rate(auth_failures_total[1m]) / rate(auth_attempts_total[1m]) > 0.1
  for: 30s
```

**Verification checklist.**
- [ ] Synthetic brute-force test triggers a page within 60 s.
- [ ] No alert fatigue in normal load.

---

## P3-030 — 🟢 P3 Low — `node-exporter` deployed but not annotated for Prometheus

**Symptom.** `infra/k8s/base/node-exporter.yaml` exists but lacks `prometheus.io/scrape: "true"` annotation. Prometheus may not auto-discover it.

**Root-cause framing.**
```
FABLE 5 pillars violated:  L (Latency) — node-level metrics missing
                            A (Architecture) — incomplete scrape config
```

**Resolution steps.**
1. Add ServiceMonitor for `node-exporter`.
2. Or annotate the DaemonSet's pods.

**Snippet.**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: node-exporter
  labels: { app: node-exporter }
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9100"
```

**Verification checklist.**
- [ ] `up{job="node-exporter"} == 1` for every node.
- [ ] Node-CPU and node-memory alerts fire correctly.