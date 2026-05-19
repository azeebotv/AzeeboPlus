# Azeebo+ Kubernetes Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines Kubernetes standards and best practices for Azeebo+ container orchestration.

---

## Kubernetes Overview

### Cluster Architecture

```
Control Plane (3 nodes)
├── API Server
├── etcd
├── Scheduler
└── Controller Manager

Worker Nodes (3+ nodes)
├── Kubelet
├── Kube-proxy
└── Container Runtime (containerd)
```

### Node Pools

| Pool | Purpose | Instance Type | Min/Max |
|------|---------|---------------|---------|
| system | System components | t3.medium | 3/5 |
| general | General workloads | t3.large | 3/10 |
| memory | Memory-intensive | m5.large | 2/5 |
| gpu | GPU workloads | g4dn.xlarge | 0/2 |

---

## Pod Standards

### Pod Specification

```yaml
# ✅ Good - Standard Pod spec
apiVersion: v1
kind: Pod
metadata:
  name: auth-service
  namespace: production
  labels:
    app: auth-service
    version: v1
    environment: production
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
    - name: auth-service
      image: registry/azeebo-plus/auth-service:1.0.0-prod
      ports:
        - containerPort: 3000
          protocol: TCP
      resources:
        requests:
          memory: "256Mi"
          cpu: "250m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
      envFrom:
        - configMapRef:
            name: auth-service-config
        - secretRef:
            name: auth-service-secrets
      livenessProbe:
        httpGet:
          path: /health
          port: 3000
        initialDelaySeconds: 40
        periodSeconds: 30
        timeoutSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /health
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
  restartPolicy: Always
```

### Resource Requests and Limits

| Service | Request CPU | Limit CPU | Request Memory | Limit Memory |
|---------|-------------|-----------|----------------|--------------|
| Auth | 250m | 500m | 256Mi | 512Mi |
| User | 250m | 500m | 256Mi | 512Mi |
| Wallet | 500m | 1000m | 512Mi | 1Gi |
| Payment | 500m | 1000m | 512Mi | 1Gi |
| Content | 250m | 500m | 256Mi | 512Mi |

---

## Deployment Standards

### Deployment Specification

```yaml
# ✅ Good - Standard Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: production
  labels:
    app: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: auth-service
        version: v1
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
      containers:
        - name: auth-service
          image: registry/azeebo-plus/auth-service:1.0.0-prod
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 40
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
      terminationGracePeriodSeconds: 30
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - auth-service
                topologyKey: kubernetes.io/hostname
```

### Horizontal Pod Autoscaler

```yaml
# ✅ Good - HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Service Standards

### Service Specification

```yaml
# ✅ Good - Service
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: production
  labels:
    app: auth-service
spec:
  type: ClusterIP
  selector:
    app: auth-service
  ports:
    - name: http
      port: 3000
      targetPort: 3000
      protocol: TCP
```

### Ingress Specification

```yaml
# ✅ Good - Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auth-service-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
    - hosts:
        - api.azeebo.plus
      secretName: azeebo-plus-tls
  rules:
    - host: api.azeebo.plus
      http:
        paths:
          - path: /v1/auth
            pathType: Prefix
            backend:
              service:
                name: auth-service
                port:
                  number: 3000
```

---

## ConfigMap and Secret Standards

### ConfigMap

```yaml
# ✅ Good - ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth-service-config
  namespace: production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
  DATABASE_HOST: "postgres.production.svc.cluster.local"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "azeebo_plus"
  REDIS_HOST: "redis.production.svc.cluster.local"
  REDIS_PORT: "6379"
```

### Secret

```yaml
# ✅ Good - Secret (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: auth-service-secrets
  namespace: production
type: Opaque
data:
  DATABASE_PASSWORD: c2VjdXJlLXBhc3N3b3Jk
  REDIS_PASSWORD: c2VjdXJlLXJlZGlzLXBhc3N3b3Jk
  JWT_SECRET: c2VjdXJlLWp3dC1zZWNyZXQ=
```

### Secret Management

```yaml
# ✅ Good - External secrets (via External Secrets Operator)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: auth-service-secrets
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: auth-service-secrets
    creationPolicy: Owner
  data:
    - secretKey: DATABASE_PASSWORD
      remoteRef:
        key: azeebo-plus/prod/db-credentials
        property: password
    - secretKey: REDIS_PASSWORD
      remoteRef:
        key: azeebo-plus/prod/redis-credentials
        property: password
    - secretKey: JWT_SECRET
      remoteRef:
        key: azeebo-plus/prod/jwt-secret
        property: secret
```

---

## PersistentVolume Standards

### PersistentVolumeClaim

```yaml
# ✅ Good - PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 100Gi
  volumeMode: Filesystem
```

### Database Pod with PVC

```yaml
# ✅ Good - Database with PVC
apiVersion: v1
kind: Pod
metadata:
  name: postgres
  namespace: production
spec:
  containers:
    - name: postgres
      image: postgres:14-alpine
      ports:
        - containerPort: 5432
      env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: password
      volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: postgres-data
```

---

## Network Policies

### Network Policy

```yaml
# ✅ Good - Network policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: auth-service-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: auth-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app: api-gateway
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: database
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector: {}
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
    - to:
        - namespaceSelector: {}
        - podSelector:
            matchLabels:
              app: secrets-manager
      ports:
        - protocol: TCP
          port: 443
```

---

## Security Standards

### Pod Security Standards

```yaml
# ✅ Good - Pod security context
apiVersion: v1
kind: Pod
metadata:
  name: auth-service
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
    - name: auth-service
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
        seccompProfile:
          type: RuntimeDefault
```

### Service Account

```yaml
# ✅ Good - Service account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: auth-service
  namespace: production
  labels:
    app: auth-service
automountServiceAccountToken: false
```

---

## Monitoring & Observability

### Metrics Server

```yaml
# ✅ Good - Metrics server (via Helm)
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: metrics-server
  namespace: kube-system
spec:
  values:
    args:
      - --kubelet-insecure-tls
      - --kubelet-preferred-address-types=InternalIP
```

### Prometheus Service Monitor

```yaml
# ✅ Good - ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: auth-service-monitor
  namespace: production
  labels:
    app: auth-service
spec:
  selector:
    matchLabels:
      app: auth-service
  namespaceSelector:
    matchNames:
      - production
  endpoints:
    - port: http
      interval: 30s
      path: /metrics
```

---

## Backup & Recovery

### Velero Backup

```yaml
# ✅ Good - Velero backup schedule
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
      - production
      - staging
    includedResources:
      - pods
      - services
      - deployments
      - persistentvolumeclaims
      - secrets
      - configmaps
    snapshotVolumes: true
    ttl: "720h"
```

---

## CI/CD Integration

### Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]
    paths:
      - 'services/auth-service/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name azeebo-plus-prod --region us-east-1

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f kubernetes/auth-service/deployment.yaml
          kubectl apply -f kubernetes/auth-service/service.yaml
          kubectl apply -f kubernetes/auth-service/hpa.yaml
          kubectl rollout status deployment/auth-service -n production
```

---

## Prohibited Actions

- No running as root
- No privileged containers
- No disabling network policies
- No hardcoded secrets
- No using latest tags
- No disabling resource limits
- No disabling security contexts
- No exposing sensitive ports
- No disabling health checks
- No bypassing RBAC