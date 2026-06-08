#!/bin/bash
set -e

NAMESPACE="${1:-azeebo}"
SERVICE="$2"
NEW_IMAGE="$3"
BLUE_GREEN_TIMEOUT="${4:-300}"

if [ -z "$SERVICE" ] || [ -z "$NEW_IMAGE" ]; then
  echo "Usage: $0 <namespace> <service> <new-image> [timeout]"
  exit 1
fi

echo "========================================="
echo "Blue-Green Deployment: $SERVICE"
echo "Namespace: $NAMESPACE"
echo "New Image: $NEW_IMAGE"
echo "Timeout: ${BLUE_GREEN_TIMEOUT}s"
echo "========================================="

ACTIVE_COLOR=$(kubectl get svc $SERVICE -n $NAMESPACE -o jsonpath='{.spec.selector.color}' 2>/dev/null || echo "blue")

if [ "$ACTIVE_COLOR" = "blue" ]; then
  INACTIVE_COLOR="green"
else
  INACTIVE_COLOR="blue"
fi

echo "Active: $ACTIVE_COLOR"
echo "Inactive: $INACTIVE_COLOR"

echo ""
echo "Step 1: Deploying to inactive environment ($INACTIVE_COLOR)..."

kubectl set image deployment/$SERVICE-$INACTIVE_COLOR \
  $SERVICE=$NEW_IMAGE \
  -n $NAMESPACE

echo "Waiting for $INACTIVE_COLOR rollout..."
kubectl rollout status deployment/$SERVICE-$INACTIVE_COLOR \
  -n $NAMESPACE \
  --timeout=${BLUE_GREEN_TIMEOUT}s

echo ""
echo "Step 2: Running health checks on $INACTIVE_COLOR..."

HEALTH_CHECK_INTERVAL=10
HEALTH_CHECK_RETRIES=3
SUCCESS_COUNT=0

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
  echo "Health check $i/$HEALTH_CHECK_RETRIES..."
  
  if curl -sf "http://$SERVICE-$INACTIVE_COLOR.$NAMESPACE.svc.cluster.local/api/v1/health" > /dev/null 2>&1; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo "✅ Health check $i passed"
  else
    echo "❌ Health check $i failed"
  fi
  
  sleep $HEALTH_CHECK_INTERVAL
done

if [ $SUCCESS_COUNT -lt $((HEALTH_CHECK_RETRIES - 1)) ]; then
  echo "❌ Health checks failed ($SUCCESS_COUNT/$HEALTH_CHECK_RETRIES passed)"
  echo "Rolling back $INACTIVE_COLOR deployment..."
  kubectl rollout undo deployment/$SERVICE-$INACTIVE_COLOR -n $NAMESPACE
  exit 1
fi

echo ""
echo "Step 3: Switching traffic from $ACTIVE_COLOR to $INACTIVE_COLOR..."

kubectl patch svc $SERVICE -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"color\":\"$INACTIVE_COLOR\"}}}"

echo "Traffic switched to $INACTIVE_COLOR"

echo ""
echo "Step 4: Verifying traffic switch..."

sleep 5

if curl -sf "http://$SERVICE.$NAMESPACE.svc.cluster.local/api/v1/health" > /dev/null 2>&1; then
  echo "✅ Traffic switch successful"
else
  echo "❌ Traffic switch failed"
  echo "Switching back to $ACTIVE_COLOR..."
  kubectl patch svc $SERVICE -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"color\":\"$ACTIVE_COLOR\"}}}"
  exit 1
fi

echo ""
echo "Step 5: Scaling down old environment ($ACTIVE_COLOR)..."

kubectl scale deployment/$SERVICE-$ACTIVE_COLOR --replicas=0 -n $NAMESPACE

echo ""
echo "========================================="
echo "✅ Blue-Green Deployment Complete"
echo "Active: $INACTIVE_COLOR"
echo "Inactive: $ACTIVE_COLOR (scaled to 0)"
echo "========================================="
