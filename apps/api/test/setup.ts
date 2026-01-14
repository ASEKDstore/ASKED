import { PrismaClient } from '@prisma/client';

// Use test database URL (SQLite for fast tests)
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file::memory:?cache=shared';

// Set test database URL before Prisma client is initialized
process.env.DATABASE_URL = TEST_DATABASE_URL;

let prisma: PrismaClient;

beforeAll(async () => {
  // Create Prisma client with test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
  });

  // Connect to database
  await prisma.$connect();

  // For SQLite, enable foreign keys
  try {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  } catch (error) {
    // Ignore if not SQLite
  }

  // Try to initialize schema if tables don't exist
  // This is a fallback - ideally schema should be set up before tests run
  try {
    // Check if any tables exist (SQLite-specific check)
    if (TEST_DATABASE_URL.includes('sqlite') || TEST_DATABASE_URL.includes('file:')) {
      const tables = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      if (tables.length === 0) {
        console.warn('⚠️  Test database appears empty. Run "pnpm test:setup" first to initialize schema.');
      }
    }
  } catch (error) {
    // Not SQLite or schema check failed - assume schema is set up
  }
});

afterAll(async () => {
  await prisma?.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  // Delete in reverse order of dependencies
  await prisma.lotAllocation.deleteMany();
  await prisma.inventoryLot.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.orderCounter.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
});

export { prisma };

