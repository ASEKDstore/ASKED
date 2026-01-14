/**
 * Setup script for test database
 * Creates SQLite test database schema from Prisma schema
 * 
 * Usage: ts-node scripts/setup-test-db.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file::memory:?cache=shared';
const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const TEMP_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.test.temp.prisma');

try {
  // Read original schema
  const originalSchema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Replace datasource with SQLite
  const testSchema = originalSchema.replace(
    /datasource db \{[^}]*\}/s,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );

  // Remove PostgreSQL-specific type annotations that SQLite doesn't support
  // SQLite handles most types, but we need to remove @db.Text, @db.VarChar, etc.
  const cleanedSchema = testSchema
    .replace(/@db\.Text/g, '')
    .replace(/@db\.VarChar\(\d+\)/g, '');

  // Write temporary schema
  fs.writeFileSync(TEMP_SCHEMA_PATH, cleanedSchema);

  console.log('📝 Created temporary test schema');

  // Push schema to test database
  console.log('🚀 Pushing schema to test database...');
  try {
    execSync(`npx prisma db push --schema=${TEMP_SCHEMA_PATH} --skip-generate --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'inherit',
    });
  } catch (error) {
    // If db push fails, try without --accept-data-loss
    console.log('⚠️  Retrying without --accept-data-loss flag...');
    execSync(`npx prisma db push --schema=${TEMP_SCHEMA_PATH} --skip-generate`, {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'inherit',
    });
  }

  console.log('✅ Test database schema created successfully');

  // Clean up
  fs.unlinkSync(TEMP_SCHEMA_PATH);
  console.log('🧹 Cleaned up temporary files');
} catch (error) {
  console.error('❌ Error setting up test database:', error);
  
  // Clean up on error
  if (fs.existsSync(TEMP_SCHEMA_PATH)) {
    fs.unlinkSync(TEMP_SCHEMA_PATH);
  }
  
  process.exit(1);
}

