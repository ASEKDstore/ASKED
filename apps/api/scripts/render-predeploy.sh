#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "Step 1: Resolving failed migration 20250106000000_allow_guest_checkout..."
pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || echo "Migration 20250106000000_allow_guest_checkout already resolved or not found"

echo "Step 2: Resolving failed migration 20250123000000_add_polet_system..."
pnpm prisma migrate resolve --rolled-back 20250123000000_add_polet_system || echo "Migration 20250123000000_add_polet_system already resolved or not found"

echo "Step 3: Applying pending migrations..."
pnpm prisma migrate deploy

echo "Step 4: Generating Prisma Client..."
pnpm prisma generate

echo "✅ Predeploy completed successfully"

