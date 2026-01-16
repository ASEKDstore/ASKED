#!/bin/bash
# Script to fix failed migration and apply pending migrations
# Use this in Render Pre-Deploy Command or run manually in Render Shell

set -e  # Exit on error

echo "Step 1: Resolving failed migration..."
pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || echo "Migration already resolved or doesn't exist"

echo "Step 2: Applying pending migrations..."
pnpm prisma migrate deploy

echo "Step 3: Checking migration status..."
pnpm prisma migrate status

echo "Step 4: Regenerating Prisma Client..."
pnpm prisma generate

echo "✅ All migration steps completed successfully!"








