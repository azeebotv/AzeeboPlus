# Kubernetes Deployment — Azeebo+

This directory contains production-grade Kubernetes manifests for all **29 backend services**, **3 frontend apps**, and **2 infrastructure services**.

---

## Architecture

```
Internet
    │
    ▼
┌─────────────────────┐
│   NGINX Ingress     │  (TLS termination, rate limiting)
│   Controller        │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌────────┐
│  Web   │  │ Admin  │  Frontend apps
│ :4000  │  │ :4016  │
└────────┘  └────────┘
    │           │
    ▼           ▼
┌─────────────────────┐
│    API Gateway      │  3 replicas + HPA (3-20)
│      :3013          │
└─────────┬───────────┘
          │
    ┌─────┴─────────────────────────────────────────┐
    │                Service Mesh                    │
    │                                               │
    │  Core (8)  Intelligence (2)  Operations (3)   │
    │  Engagement (6)  Universes (9)                 │
    │                                               │
    └────────────┬──────────────────────┬────────────┘
                 │                      │
                 ▼                      ▼
          ┌────────────┐        ┌────────────┐
          │ PostgreSQL │        │   Redis    │
          │  (16-alpine)│       │ (7-alpine) │
          └────────────┘        └────────────┘
```

## Directory Structure

```
k8s/
├── base/                        # Shared resources
│   ├── namespace.yaml           # azeebo namespace
│   ├── configmap.yaml           # Shared environment variables
│   ├── secrets.yaml             # Secrets template (base64)
│   ├── network-policy.yaml      # Network isolation rules
│   └── pdb.yaml                 # Pod Disruption Budgets
├── infra/                       # Infrastructure
│   ├── postgres.yaml            # PostgreSQL StatefulSet
│   └── redis.yaml               # Redis StatefulSet
├── gateway/                     # API Gateway
│   └── api-gateway.yaml         # Gateway Deployment + Service
├── services/                    # Backend microservices
│   ├── core/                    # 8 core services
│   ├── intelligence/            # 2 AI services
│   ├── operations/              # 3 ops services
│   ├── engagement/              # 6 engagement services
│   └── universes/               # 9 universe services
├── apps/                        # Frontend applications
│   ├── web.yaml                 # Web app (:4000)
│   ├── admin.yaml               # Admin panel (:4016)
│   └── creator.yaml             # Creator panel (:4014)
├── ingress/                     # Ingress rules
│   ├── ingress.yaml             # HTTP/HTTPS ingress
│   └── ingress-websocket.yaml   # WebSocket ingress
├── hpa/                         # Horizontal Pod Autoscalers
│   ├── api-gateway.yaml         # 3-20 replicas
│   ├── auth-service.yaml        # 2-8 replicas
│   ├── content-service.yaml     # 2-10 replicas
│   ├── messaging-service.yaml   # 2-12 replicas
│   ├── notification-service.yaml# 2-8 replicas
│   ├── payment-service.yaml     # 2-8 replicas
│   └── search-service.yaml      # 2-10 replicas
├── kustomization.yaml           # Kustomize entry point
├── generate-deployments.sh      # Manifest generator script
└── README.md                    # This file
```

## Quick Start

### Prerequisites

- Kubernetes cluster (1.24+)
- `kubectl` configured
- `kustomize` (optional, bundled with kubectl)
- Docker images pushed to `ghcr.io/vmnl/`

### Deploy All

```bash
# Option 1: Using kustomize (recommended)
kubectl apply -k k8s/

# Option 2: Using kubectl directly
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/configmap.yaml -f k8s/base/secrets.yaml
kubectl apply -f k8s/base/network-policy.yaml -f k8s/base/pdb.yaml
kubectl apply -f k8s/infra/
kubectl apply -R -f k8s/gateway/ -f k8s/services/ -f k8s/apps/
kubectl apply -f k8s/ingress/ -f k8s/hpa/
```

### Deploy Category by Category

```bash
# Core only
kubectl apply -R -f k8s/services/core/

# Intelligence
kubectl apply -R -f k8s/services/intelligence/

# Engagement
kubectl apply -R -f k8s/services/engagement/

# Universes
kubectl apply -R -f k8s/services/universes/

# Frontend apps
kubectl apply -R -f k8s/apps/
```

### Verify Deployment

```bash
# Check all pods
kubectl get pods -n azeebo

# Check services
kubectl get svc -n azeebo

# Check ingress
kubectl get ingress -n azeebo

# Check HPAs
kubectl get hpa -n azeebo

# Check PDBs
kubectl get pdb -n azeebo

# Watch pod status
kubectl get pods -n azeebo -w

# Check logs for a specific service
kubectl logs -f deployment/api-gateway -n azeebo
```

## Services Catalog

### Core Services (8)
| Service | Port | Replicas | HPA | Description |
|---------|------|----------|-----|-------------|
| auth-service | 3000 | 2 | 2-8 | Authentication, JWT, OAuth |
| user-service | 3001 | 2 | — | User profiles, avatars |
| wallet-service | 3002 | 2 | — | Digital wallet, balances |
| payment-service | 3003 | 2 | 2-8 | Stripe, Paystack, Flutterwave |
| content-service | 3004 | 2 | 2-10 | Content CRUD, downloads |
| search-service | 3005 | 2 | 2-10 | Full-text search |
| media-service | 3009 | 2 | — | Media processing, CDN |
| knowledge-service | 3011 | 2 | — | Knowledge base |

### Intelligence Services (2)
| Service | Port | Replicas | HPA | Description |
|---------|------|----------|-----|-------------|
| analytics-service | 3008 | 2 | — | Analytics, metrics |
| recommendation-service | 3010 | 2 | — | AI recommendations |

### Operations Services (3)
| Service | Port | Replicas | HPA | Description |
|---------|------|----------|-----|-------------|
| support-service | 3020 | 2 | — | Customer support |
| moderation-service | 3022 | 2 | — | Content moderation |
| queue-service | 3015 | 2 | — | Job queues |

### Engagement Services (6)
| Service | Port | Replicas | HPA | Description |
|---------|------|----------|-----|-------------|
| notification-service | 3006 | 2 | 2-8 | Push, email, SMS |
| reward-service | 3007 | 2 | — | Points, rewards |
| subscription-service | 3026 | 2 | — | Subscriptions |
| referral-service | 3025 | 2 | — | Referral programs |
| engagement-service | 3023 | 2 | — | Likes, comments, shares |
| messaging-service | 3024 | 2 | 2-12 | Real-time chat |

### Universe Services (9)
| Service | Port | Replicas | HPA | Description |
|---------|------|----------|-----|-------------|
| creator-service | 3018 | 2 | — | Creator dashboard |
| comedy-service | 3012 | 2 | — | Comedy content |
| live-event-service | 3027 | 2 | — | Live events, streaming |
| reality-service | 3016 | 2 | — | Reality TV |
| games-service | 3014 | 2 | — | Gaming content |
| lifestyle-service | 3017 | 2 | — | Lifestyle content |
| movie-service | 3011 | 2 | — | Nollywood, movies |
| vertical-service | 3019 | 2 | — | Vertical video |
| sports-service | 3021 | 2 | — | Sports, Super Eagles |

### Frontend Apps (3)
| App | Port | Replicas | Description |
|-----|------|----------|-------------|
| web | 4000 | 1 | Main web app (Next.js) |
| admin | 4016 | 1 | Admin dashboard (Vite) |
| creator | 4014 | 1 | Creator panel (Vite) |

### Infrastructure (2)
| Service | Port | Storage | Description |
|---------|------|---------|-------------|
| postgres | 5432 | 10Gi | PostgreSQL 16 |
| redis | 6379 | 2Gi | Redis 7 |

## Production Checklist

### Before deploying:
- [ ] Update `k8s/base/secrets.yaml` with real base64-encoded values
- [ ] Update image tags in deployment manifests (or use image tags)
- [ ] Configure `cert-manager` for TLS certificates
- [ ] Configure `ingress-nginx` controller
- [ ] Set up `kubectl` access to your cluster
- [ ] Push Docker images to `ghcr.io/vmnl/`

### Required secrets:
```bash
# Encode secrets for k8s
echo -n 'your-database-url' | base64
echo -n 'your-jwt-secret' | base64
echo -n 'your-redis-url' | base64
```

### Post-deploy:
```bash
# Verify all pods are running
kubectl get pods -n azeebo | grep -v Running

# Check for failed pods
kubectl get events -n azeebo --sort-by='.lastTimestamp'

# Port-forward to test locally
kubectl port-forward svc/api-gateway 3013:3013 -n azeebo
kubectl port-forward svc/azeebo-web 4000:4000 -n azeebo
```

## Scaling

HPAs are configured for high-traffic services:
- **API Gateway**: 3-20 pods (scales at 70% CPU)
- **Auth Service**: 2-8 pods (scales at 70% CPU)
- **Content Service**: 2-10 pods (scales at 75% CPU)
- **Messaging Service**: 2-12 pods (scales at 70% CPU + connections)
- **Payment Service**: 2-8 pods (scales at 65% CPU)
- **Search Service**: 2-10 pods (scales at 70% CPU)
- **Notification Service**: 2-8 pods (scales at 70% CPU)

## Troubleshooting

```bash
# Pod stuck in CrashLoopBackOff
kubectl logs <pod-name> -n azeebo --previous

# Service not reachable
kubectl describe svc <service-name> -n azeebo
kubectl get endpoints <service-name> -n azeebo

# Network policy blocking traffic
kubectl get networkpolicy -n azeebo
kubectl describe networkpolicy <policy-name> -n azeebo

# HPA not scaling
kubectl describe hpa <hpa-name> -n azeebo

# Database connection issues
kubectl exec -it deployment/postgres -n azeebo -- psql -U postgres -l

# Redis connection issues
kubectl exec -it deployment/redis -n azeebo -- redis-cli ping
```
