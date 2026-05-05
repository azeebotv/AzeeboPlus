#!/bin/bash
set -e

echo "Running Prisma migrations for all services..."

for service in services/*/; do
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

for module in modules/*/; do
  if [ -f "$module/prisma/schema.prisma" ]; then
    module_name=$(basename "$module")
    echo "Migrating $module_name..."

    cd "$module"

    if [ -f "package.json" ]; then
      npx prisma migrate deploy
    fi

    cd ../..
    echo "Completed migration for $module_name"
  fi
done

echo "All migrations completed successfully!"
