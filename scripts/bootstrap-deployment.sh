#!/bin/bash

# FlowStack Deployment Bootstrapper
# Standardizes all services for Cloud Deployment (Vercel/Railway/Fly)

echo "🚀 Bootstrapping FlowStack for Cloud Deployment..."

# 1. Update all Next.js Frontends to use dynamically assigned $PORT
echo "Standardizing Frontends..."
find products -name "package.json" | grep "/web/" | while read -r file; do
  sed -i '' 's/next start -p [0-9]*/next start -p $PORT/g' "$file"
done

# 2. Update all NestJS Backends to use start:prod
echo "Standardizing Backends..."
find products -name "package.json" | grep "/api/" | while read -r file; do
  if ! grep -q "start:prod" "$file"; then
    sed -i '' 's/"start": "nest start"/"start": "nest start", "start:prod": "node dist\/main"/g' "$file"
  fi
done

# 3. Create individual Railway configs if missing
echo "Applying Cloud Templates..."
for product in products/*; do
  if [ -d "$product/apps/api" ]; then
    cp deployment/railway/template.json "$product/apps/api/railway.json"
  fi
done

echo "✅ FlowStack is ready for launch!"
