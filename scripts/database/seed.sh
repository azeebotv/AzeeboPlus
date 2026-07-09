#!/bin/bash

set -euo pipefail

echo "🌱 Seeding Azeebo+ Database..."

echo "Creating initial universes..."
npx prisma db execute --file=./prisma/seed/universes.sql

echo "Creating initial admin user..."
npx prisma db execute --file=./prisma/seed/admin.sql

echo "✅ Database seeded successfully!"
