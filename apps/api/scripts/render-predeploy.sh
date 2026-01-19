#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || true
pnpm prisma migrate resolve --rolled-back 20250123000000_add_polet_system || true

pnpm prisma migrate deploy
pnpm prisma generate

echo "Predeploy done"

