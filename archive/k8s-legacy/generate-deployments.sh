#!/bin/bash
# generate-deployments.sh — Generates K8s Deployment + Service manifests for all 29 Azeebo+ services
# Compatible with macOS (bash 3) and Linux

set -e

# AUD-15: an immutable release tag is mandatory — a silent fallback to
# `:latest` (or a hardcoded one, as generate_app had) defeats rollback and
# makes every deploy un-reproducible. Fail before writing any manifest.
# Usage: IMAGE_TAG=$(git rev-parse --short HEAD) bash k8s/generate-deployments.sh
: "${IMAGE_TAG:?IMAGE_TAG is required (immutable release tag, e.g. git SHA or release version)}"

NS="azeebo"
OUTDIR="k8s"

mkdir -p "${OUTDIR}/services/core"
mkdir -p "${OUTDIR}/services/intelligence"
mkdir -p "${OUTDIR}/services/operations"
mkdir -p "${OUTDIR}/services/engagement"
mkdir -p "${OUTDIR}/services/universes"
mkdir -p "${OUTDIR}/gateway"
mkdir -p "${OUTDIR}/apps"

generate_deployment() {
  local category="$1"
  local shortname="$2"
  local port="$3"
  local replicas="$4"
  local cpu="$5"
  local mem="$6"
  local health="$7"
  local tag="${IMAGE_TAG}"
  local registry="${IMAGE_REGISTRY:-ghcr.io/vmnl}"
  local image="${registry}/${shortname}:${tag}"

  cat <<YAML
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${shortname}
  namespace: ${NS}
  labels:
    app.kubernetes.io/name: ${shortname}
    app.kubernetes.io/part-of: azeebo
    app.kubernetes.io/component: ${category}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app.kubernetes.io/name: ${shortname}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${shortname}
        app.kubernetes.io/part-of: azeebo
        app.kubernetes.io/component: ${category}
    spec:
      containers:
        - name: ${shortname}
          image: ${image}
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: ${port}
              protocol: TCP
          envFrom:
            - configMapRef:
                name: azeebo-config
            - secretRef:
                name: azeebo-secrets
                optional: true
          env:
            - name: PORT
              value: "${port}"
            - name: SERVICE_NAME
              value: "${shortname}"
          resources:
            requests:
              cpu: ${cpu}
              memory: ${mem}
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: ${health}
              port: ${port}
            initialDelaySeconds: 30
            periodSeconds: 15
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: ${health}
              port: ${port}
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: ${health}
              port: ${port}
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ${shortname}
  namespace: ${NS}
  labels:
    app.kubernetes.io/name: ${shortname}
    app.kubernetes.io/part-of: azeebo
spec:
  selector:
    app.kubernetes.io/name: ${shortname}
  ports:
    - port: ${port}
      targetPort: ${port}
      protocol: TCP
      name: http
  type: ClusterIP
YAML
}

generate_app() {
  local name="$1"
  local port="$2"
  local replicas="$3"
  local cpu="$4"
  local mem="$5"
  # AUD-15: was hardcoded to :latest and ignored IMAGE_REGISTRY — frontends
  # now resolve the same tag/registry path as the services above.
  local registry="${IMAGE_REGISTRY:-ghcr.io/vmnl}"
  local image="${registry}/azeebo-${name}:${IMAGE_TAG}"

  cat <<YAML
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: azeebo-${name}
  namespace: ${NS}
  labels:
    app.kubernetes.io/name: azeebo-${name}
    app.kubernetes.io/part-of: azeebo
    app.kubernetes.io/component: frontend
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app.kubernetes.io/name: azeebo-${name}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: azeebo-${name}
        app.kubernetes.io/part-of: azeebo
        app.kubernetes.io/component: frontend
    spec:
      containers:
        - name: azeebo-${name}
          image: ${image}
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: ${port}
              protocol: TCP
          env:
            - name: PORT
              value: "${port}"
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              cpu: ${cpu}
              memory: ${mem}
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /
              port: ${port}
            initialDelaySeconds: 15
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /
              port: ${port}
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: azeebo-${name}
  namespace: ${NS}
  labels:
    app.kubernetes.io/name: azeebo-${name}
    app.kubernetes.io/part-of: azeebo
spec:
  selector:
    app.kubernetes.io/name: azeebo-${name}
  ports:
    - port: ${port}
      targetPort: ${port}
      protocol: TCP
      name: http
  type: ClusterIP
YAML
}

echo "=== Generating K8s deployment manifests ==="

# --- Core services ---
generate_deployment core auth-service 3000 2 100m 128Mi /health > ${OUTDIR}/services/core/auth-service.yaml
echo "  auth-service"
generate_deployment core user-service 3001 2 100m 128Mi /health > ${OUTDIR}/services/core/user-service.yaml
echo "  user-service"
generate_deployment core wallet-service 3002 2 100m 128Mi /health > ${OUTDIR}/services/core/wallet-service.yaml
echo "  wallet-service"
generate_deployment core payment-service 3003 2 100m 256Mi /health > ${OUTDIR}/services/core/payment-service.yaml
echo "  payment-service"
generate_deployment core content-service 3004 2 150m 256Mi /health > ${OUTDIR}/services/core/content-service.yaml
echo "  content-service"
generate_deployment core search-service 3005 2 100m 128Mi /health > ${OUTDIR}/services/core/search-service.yaml
echo "  search-service"
generate_deployment core media-service 3009 2 100m 256Mi /health > ${OUTDIR}/services/core/media-service.yaml
echo "  media-service"
generate_deployment core knowledge-service 3011 2 100m 128Mi /health > ${OUTDIR}/services/core/knowledge-service.yaml
echo "  knowledge-service"

# --- Intelligence services ---
generate_deployment intelligence analytics-service 3008 2 150m 256Mi /health > ${OUTDIR}/services/intelligence/analytics-service.yaml
echo "  analytics-service"
generate_deployment intelligence recommendation-service 3010 2 150m 256Mi /health > ${OUTDIR}/services/intelligence/recommendation-service.yaml
echo "  recommendation-service"

# --- Operations services ---
generate_deployment operations support-service 3020 2 100m 128Mi /health > ${OUTDIR}/services/operations/support-service.yaml
echo "  support-service"
generate_deployment operations moderation-service 3022 2 100m 128Mi /health > ${OUTDIR}/services/operations/moderation-service.yaml
echo "  moderation-service"
generate_deployment operations queue-service 3015 2 100m 128Mi /health > ${OUTDIR}/services/operations/queue-service.yaml
echo "  queue-service"

# --- Engagement services ---
generate_deployment engagement notification-service 3006 2 100m 128Mi /health > ${OUTDIR}/services/engagement/notification-service.yaml
echo "  notification-service"
generate_deployment engagement reward-service 3007 2 100m 128Mi /health > ${OUTDIR}/services/engagement/reward-service.yaml
echo "  reward-service"
generate_deployment engagement subscription-service 3026 2 100m 128Mi /health > ${OUTDIR}/services/engagement/subscription-service.yaml
echo "  subscription-service"
generate_deployment engagement referral-service 3025 2 100m 128Mi /health > ${OUTDIR}/services/engagement/referral-service.yaml
echo "  referral-service"
generate_deployment engagement engagement-service 3023 2 100m 128Mi /health > ${OUTDIR}/services/engagement/engagement-service.yaml
echo "  engagement-service"
generate_deployment engagement messaging-service 3024 2 100m 256Mi /health > ${OUTDIR}/services/engagement/messaging-service.yaml
echo "  messaging-service"

# --- Universe services ---
generate_deployment universes creator-service 3018 2 100m 256Mi /health > ${OUTDIR}/services/universes/creator-service.yaml
echo "  creator-service"
generate_deployment universes comedy-service 3012 2 100m 128Mi /health > ${OUTDIR}/services/universes/comedy-service.yaml
echo "  comedy-service"
generate_deployment universes live-event-service 3027 2 100m 256Mi /health > ${OUTDIR}/services/universes/live-event-service.yaml
echo "  live-event-service"
generate_deployment universes reality-service 3016 2 100m 128Mi /health > ${OUTDIR}/services/universes/reality-service.yaml
echo "  reality-service"
generate_deployment universes games-service 3014 2 100m 128Mi /health > ${OUTDIR}/services/universes/games-service.yaml
echo "  games-service"
generate_deployment universes lifestyle-service 3017 2 100m 128Mi /health > ${OUTDIR}/services/universes/lifestyle-service.yaml
echo "  lifestyle-service"
generate_deployment universes movie-service 3011 2 100m 128Mi /health > ${OUTDIR}/services/universes/movie-service.yaml
echo "  movie-service"
generate_deployment universes vertical-service 3019 2 100m 128Mi /health > ${OUTDIR}/services/universes/vertical-service.yaml
echo "  vertical-service"
generate_deployment universes sports-service 3021 2 100m 128Mi /health > ${OUTDIR}/services/universes/sports-service.yaml
echo "  sports-service"

# --- Gateway ---
generate_deployment gateway api-gateway 3013 3 200m 256Mi /health > ${OUTDIR}/gateway/api-gateway.yaml
echo "  api-gateway (3 replicas)"

# --- Frontend apps ---
generate_app web 4000 1 100m 256Mi > ${OUTDIR}/apps/web.yaml
echo "  azeebo-web"
generate_app admin 4016 1 100m 256Mi > ${OUTDIR}/apps/admin.yaml
echo "  azeebo-admin"
generate_app creator 4014 1 100m 256Mi > ${OUTDIR}/apps/creator.yaml
echo "  azeebo-creator"

echo ""
echo "=== Generated $(find ${OUTDIR} -name '*.yaml' | wc -l | tr -d ' ') manifest files ==="
echo "Total: 29 backend services + 3 frontend apps + 2 infra = 34 deployments"
echo ""
echo "Apply all:"
echo "  kubectl apply -f k8s/base/namespace.yaml"
echo "  kubectl apply -f k8s/base/configmap.yaml -f k8s/base/secrets.yaml"
echo "  kubectl apply -f k8s/infra/"
echo "  kubectl apply -R -f k8s/gateway/ -f k8s/services/ -f k8s/apps/"
