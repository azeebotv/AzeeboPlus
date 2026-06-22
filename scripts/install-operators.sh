#!/bin/bash
# Install Kubernetes Operators for Staging
# Run: ./scripts/install-operators.sh

set -euo pipefail

NAMESPACE="${NAMESPACE:-azeebo}"

echo "Installing operators to namespace: $NAMESPACE"

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 1. Install External Secrets Operator
echo "Installing External Secrets Operator..."
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets external-secrets/external-secrets \
  -f infra/helm/external-secrets-operator/values.yaml \
  -n external-secrets \
  --create-namespace \
  --wait

# 2. Install PostgreSQL Operator (Spilo/Zalando)
echo "Installing PostgreSQL Operator..."
helm repo add postgres-operator https://opensource.zalando.com/postgres-operator/charts/postgres-operator
helm repo update
helm install postgres-operator postgres-operator/postgres-operator \
  -n $NAMESPACE \
  --wait

# 3. Install Prometheus Operator (if not present)
echo "Installing Prometheus Operator..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n azeebo-monitoring \
  --create-namespace \
  --wait

echo "All operators installed successfully!"
echo "Next steps:"
echo "  1. Configure AWS/GCP secrets in Secrets Manager"
echo "  2. Apply ExternalSecret manifests: kubectl apply -f infra/k8s/base/external-secrets.yaml"
echo "  3. Deploy PostgreSQL HA: kubectl apply -f infra/k8s/base/postgres-ha.yaml"