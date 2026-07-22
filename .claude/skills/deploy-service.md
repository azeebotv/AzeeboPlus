# Skill: Deploy Service

> Deploy a service to Docker or Kubernetes.

---

## Usage

```
/deploy-service [service] [environment]

Examples:
/deploy-service reality-service staging
/deploy-service wallet-service production
/deploy-service --all staging
```

## What It Does

1. Builds the service Docker image
2. Pushes to container registry
3. Updates deployment configuration
4. Rolling update to cluster
5. Verifies health after deployment

## Deployment Commands

```bash
# Build Docker image
docker build -t ghcr.io/azeebotv/[service-name]:[tag] services/[category]/[service-name]

# Push to registry
docker push ghcr.io/azeebotv/[service-name]:[tag]

# Deploy to Kubernetes
kubectl apply -f infra/k8s/[service-name]/deployment.yaml

# Check rollout status
kubectl rollout status deployment/[service-name] -n azeebo

# Rollback if needed
kubectl rollout undo deployment/[service-name] -n azeebo
```

## Docker Compose (Local)

```bash
# Start specific service
docker compose -f docker-compose.all-in-one.yml up -d [service-name]

# Restart service
docker compose restart [service-name]

# View logs
docker compose logs -f [service-name]
```

## Rules

- Never deploy directly to production without review
- Always run tests before deployment
- Use semantic versioning for tags
- Monitor health after deployment
- Keep rollback plan ready
