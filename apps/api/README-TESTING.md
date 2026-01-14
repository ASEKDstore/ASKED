# Testing Guide for FIFO Warehouse Accounting

## Test Setup

The test suite uses SQLite in-memory database for fast, isolated tests.

### Initial Setup

Before running tests for the first time, set up the test database schema:

```bash
cd apps/api
pnpm test:setup
```

This creates a SQLite-compatible schema from the Prisma schema. You only need to run this once, or when the schema changes.

## Running Tests

### Run all tests:
```bash
pnpm --filter api test
```

### Run only FIFO warehouse tests:
```bash
pnpm --filter api test:fifo
```

### Run tests in watch mode:
```bash
pnpm --filter api test:watch
```

### Run with coverage:
```bash
pnpm --filter api test:cov
```

## Test Database

Tests use SQLite in-memory database (`file::memory:?cache=shared`) by default.

You can override with environment variable:
```bash
TEST_DATABASE_URL=file:./test.db pnpm --filter api test
```

**Important:** 
- Tests automatically clean the database before each test. No manual cleanup needed.
- The test database is isolated from production - no risk of data corruption.

## Test Structure

### Test Files
- `test/warehouse-fifo.spec.ts` - Core FIFO correctness tests

### Test Helpers
- `test/helpers/warehouse-test-helpers.ts` - Helper functions for creating test data:
  - `createProduct()` - Create test products
  - `postPurchase()` - Create and post purchases (creates lots)
  - `getStockFromMovements()` - Calculate stock from movements
  - `getStockFromLots()` - Calculate stock from lots
  - `getLots()` - Get all lots for a product
  - `getAllocationsForOrderItem()` - Get allocations for an order item

### Test Setup
- `test/setup.ts` - Database setup and cleanup

## Test Coverage

The test suite includes 5 core FIFO correctness tests:

### Test 1: FIFO Allocation Across Multiple Lots
- Creates two purchases with different costs
- Creates an order that spans both lots
- Verifies allocations follow FIFO order
- Verifies COGS calculation is correct
- Verifies lot remaining quantities are correct

### Test 2: Stock Validation
- Attempts to create order with insufficient stock
- Verifies error is thrown
- Verifies lots are NOT mutated
- Verifies no allocations or movements are created

### Test 3: Write-off FIFO Consumption
- Creates multiple purchases
- Creates a write-off
- Verifies write-off consumes lots FIFO
- Verifies allocations are created correctly

### Test 4: Stock Invariants
- Performs various IN/OUT/ADJUST operations
- Verifies stock calculated from lots matches stock from movements
- Ensures data consistency

### Test 5: Idempotency / Retry Safety
- Creates order with idempotency key
- Retries order creation with same key
- Verifies same order is returned
- Verifies lots are NOT double-consumed
- Verifies allocations are NOT duplicated

### Additional Invariant Tests
- No negative lot quantities
- Allocations sum equals order item quantity
- COGS equals sum of (allocation.qty * allocation.unitCost)

## Runtime Invariants

The `FifoAllocationService` includes runtime assertions (enabled in non-production environments) that verify:

1. **No negative lot quantities** - `lot.qtyRemaining >= 0` at all times
2. **Complete allocation** - All requested quantity is allocated
3. **Allocation sum correctness** - `sum(allocation.qty) == requestedQuantity`
4. **COGS correctness** - `COGS == sum(allocation.qty * allocation.unitCost)`

These assertions help catch bugs during development and testing.

## Idempotency

Orders support idempotency keys to prevent double-processing on retries:

```typescript
const order = await ordersService.create(userId, {
  items: [...],
  customerName: '...',
  customerPhone: '...',
  idempotencyKey: 'unique-key-123', // Optional
});
```

If an order with the same `idempotencyKey` already exists, the existing order is returned without consuming lots again.

## CI/CD

Tests run in CI without requiring production database. SQLite in-memory database is used automatically.

### CI Test Command
```bash
pnpm --filter api test
```

No additional setup required - tests are fully isolated and deterministic.

