#!/bin/bash

set -euo pipefail

echo "🚀 Setting up Azeebo+ Database..."

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Database migrations completed!"

echo "📝 Generating Prisma Client..."
npx prisma generate

echo "✨ Database setup complete!"
