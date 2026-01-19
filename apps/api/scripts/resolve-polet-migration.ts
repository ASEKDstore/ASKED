/**
 * Script to resolve failed migration P3009
 * 
 * This script marks the failed migration 20250123000000_add_polet_system as rolled back,
 * allowing Prisma to apply it again with the corrected SQL.
 * 
 * Usage:
 *   pnpm ts-node scripts/resolve-polet-migration.ts
 * 
 * Or on Render:
 *   pnpm --filter api exec ts-node scripts/resolve-polet-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveFailedMigration() {
  const migrationName = '20250123000000_add_polet_system';

  try {
    console.log(`Resolving failed migration: ${migrationName}`);

    // Check current migration status
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name = ${migrationName}
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (migrations.length === 0) {
      console.log(`Migration ${migrationName} not found in _prisma_migrations table.`);
      console.log('It may not have been attempted yet, or the table structure is different.');
      return;
    }

    const migration = migrations[0];

    if (migration.rolled_back_at) {
      console.log(`Migration ${migrationName} is already marked as rolled back.`);
      return;
    }

    if (migration.finished_at) {
      console.log(`Migration ${migrationName} is already marked as finished.`);
      console.log('No action needed.');
      return;
    }

    // Mark as rolled back
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations"
      SET rolled_back_at = NOW()
      WHERE migration_name = ${migrationName}
        AND finished_at IS NULL
        AND rolled_back_at IS NULL
    `;

    console.log(`✅ Migration ${migrationName} marked as rolled back.`);
    console.log('You can now run: pnpm prisma migrate deploy');

  } catch (error) {
    console.error('Error resolving migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resolveFailedMigration()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

