#!/bin/bash
set -euo pipefail

echo "Running Prisma migrations for all services..."

for service in services/*/*/; do
  if [ -f "$service/prisma/schema.prisma" ]; then
    service_name=$(basename "$service")
    echo "Migrating $service_name..."

    cd "$service"

    if [ -f "package.json" ]; then
      npx prisma migrate deploy
    fi

    cd ../..
    echo "Completed migration for $service_name"
  fi
done

for app in apps/*/; do
  if [ -f "$app/prisma/schema.prisma" ]; then
    app_name=$(basename "$app")
    echo "Migrating $app_name..."

    cd "$app"

    if [ -f "package.json" ]; then
      npx prisma migrate deploy
    fi

    cd ../..
    echo "Completed migration for $app_name"
  fi
done

echo "All migrations completed successfully!"
