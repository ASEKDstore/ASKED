#!/bin/bash
# Script to resolve failed migration P3009
# Execute this on Render Shell or locally with DATABASE_URL set

set -e

echo "=========================================="
echo "Resolving failed migration P3009"
echo "=========================================="
echo ""

MIGRATION_NAME="20250123000000_add_polet_system"

echo "Step 1: Marking migration as rolled back..."
pnpm prisma migrate resolve --rolled-back "$MIGRATION_NAME"

echo ""
echo "Step 2: Checking migration status..."
pnpm prisma migrate status

echo ""
echo "Step 3: Applying migrations..."
pnpm prisma migrate deploy

echo ""
echo "=========================================="
echo "✅ Migration resolution complete!"
echo "=========================================="

