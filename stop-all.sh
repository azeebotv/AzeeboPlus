#!/bin/bash
# ============================================================
# Azeebo+ Stop All Services
# ============================================================
# Stops all 29 backend services + 3 frontend apps.
# Run: ./stop-all.sh
# ============================================================

echo "=== Stopping all Azeebo+ services ==="

stopped=0
for port in $(seq 3000 3028) 4000 4014 4016 4100 4104; do
  pid=$(lsof -ti :$port -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "  Stopping port $port (PID $pid)"
    echo "$pid" | xargs kill 2>/dev/null || true
    stopped=$((stopped+1))
  fi
done

if [ $stopped -gt 0 ]; then
  sleep 1
  # Force kill survivors
  for port in $(seq 3000 3028) 4000 4014 4016 4100 4104; do
    survivors=$(lsof -ti :$port -sTCP:LISTEN 2>/dev/null || true)
    [ -n "$survivors" ] && echo "$survivors" | xargs kill -9 2>/dev/null || true
  done
  echo ""
  echo "Stopped $stopped service(s)"
else
  echo "  No running services found"
fi
