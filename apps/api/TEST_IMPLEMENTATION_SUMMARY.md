# FIFO Test Suite Implementation Summary

## Overview

This document summarizes the implementation of a comprehensive test suite for FIFO warehouse accounting with protective invariants and idempotency support.

## 1. Plan

### Test Strategy
- **Database**: SQLite in-memory database (`file::memory:?cache=shared`) for fast, isolated tests
- **Test Framework**: Jest (already configured)
- **Test Isolation**: Each test runs in a clean database state
- **CI Safety**: No production database required

### Test Coverage
1. FIFO allocation across multiple lots
2. Stock validation (rejects insufficient stock without mutation)
3. Write-off FIFO consumption
4. Stock invariants (lots vs movements consistency)
5. Idempotency / retry safety

### Runtime Invariants
- No negative lot quantities
- Allocations sum equals consumed quantity
- COGS computed correctly from allocations
- Stock from lots matches stock from movements

## 2. Test Setup Changes

### Files Modified/Created

#### `apps/api/package.json`
- Added `test:setup` script to initialize test database schema

#### `apps/api/test/setup.ts`
- Enhanced database setup with SQLite foreign key support
- Added schema validation check
- Improved error handling

#### `apps/api/scripts/setup-test-db.ts` (NEW)
- Script to create SQLite-compatible schema from Prisma schema
- Handles PostgreSQL-to-SQLite conversion
- Removes PostgreSQL-specific type annotations

#### `apps/api/jest.config.js`
- Already configured correctly
- Uses `test/setup.ts` for setup

## 3. New Test Files

### `apps/api/test/warehouse-fifo.spec.ts`
Complete test suite with all 5 core tests:

1. **Test 1: FIFO Allocation Across Multiple Lots**
   - Creates product
   - Posts two purchases (10@500, 10@700)
   - Creates order for qty 12
   - Verifies: allocations 10@500 + 2@700, lot1.remaining=0, lot2.remaining=8, COGS=6400

2. **Test 2: Stock Validation**
   - Creates product
   - Posts purchase (5@500)
   - Attempts order qty 6
   - Verifies: throws error, lot unchanged, no allocations, no movements

3. **Test 3: Write-off FIFO Consumption**
   - Creates two purchases (5@100, 5@200)
   - Creates write-off qty 7
   - Verifies: allocations 5@100 + 2@200, lot1.remaining=0, lot2.remaining=3

4. **Test 4: Stock Invariants**
   - Performs IN/OUT/ADJUST operations
   - Verifies: stockFromLots == stockFromMovements

5. **Test 5: Idempotency / Retry Safety**
   - Creates order with idempotency key
   - Retries with same key
   - Verifies: same order returned, lots not double-consumed, allocations not duplicated

### `apps/api/test/helpers/warehouse-test-helpers.ts`
Test helper functions:
- `createProduct()` - Create test products
- `postPurchase()` - Create and post purchases (creates lots)
- `getStockFromMovements()` - Calculate stock from movements
- `getStockFromLots()` - Calculate stock from lots
- `getLots()` - Get all lots for a product
- `getAllocationsForOrderItem()` - Get allocations for an order item

## 4. Minimal Code Changes for Testability

### Schema Changes

#### `apps/api/prisma/schema.prisma`
- Added `idempotencyKey String? @unique` to `Order` model
- Added index on `idempotencyKey`

### Service Changes

#### `apps/api/src/orders/orders.service.ts`
- Added idempotency key check in `create()` method
- If order with same `idempotencyKey` exists, return existing order without consuming lots
- Updated `mapToDto()` to include `cogsTotal` in order items

#### `apps/api/src/orders/dto/create-order.dto.ts`
- Added optional `idempotencyKey` field to `createOrderSchema`

#### `apps/api/src/orders/dto/order.dto.ts`
- Added `cogsTotal` field to `orderItemDtoSchema`

#### `apps/api/src/warehouse/fifo-allocation.service.ts`
- Enhanced runtime invariants:
  - Verifies COGS calculation matches allocations
  - Verifies all lots have non-negative remaining after allocation
  - All existing invariants maintained

## 5. How to Run Tests

### Initial Setup (First Time Only)
```bash
cd apps/api
pnpm test:setup
```

This creates the SQLite test database schema. Only needed once or when schema changes.

### Run All Tests
```bash
pnpm --filter api test
```

### Run Only FIFO Tests
```bash
pnpm --filter api test:fifo
```

### Run Tests in Watch Mode
```bash
pnpm --filter api test:watch
```

### Run Tests with Coverage
```bash
pnpm --filter api test:cov
```

### Custom Test Database
```bash
TEST_DATABASE_URL=file:./test.db pnpm --filter api test
```

## 6. Runtime Invariants

The `FifoAllocationService` includes runtime assertions (enabled in non-production) that verify:

1. **No Negative Quantities**: `lot.qtyRemaining >= 0` at all times
2. **Complete Allocation**: All requested quantity is allocated (`remainingNeeded == 0`)
3. **Allocation Sum Correctness**: `sum(allocation.qty) == requestedQuantity`
4. **COGS Correctness**: `COGS == sum(allocation.qty * allocation.unitCost)`
5. **Post-Allocation Validation**: All affected lots have non-negative remaining

These assertions throw explicit errors if violated, helping catch bugs during development.

## 7. Idempotency Implementation

### How It Works
1. Client provides optional `idempotencyKey` when creating order
2. Service checks if order with same key exists
3. If exists, returns existing order without consuming lots
4. If not exists, creates new order normally

### Usage
```typescript
const order = await ordersService.create(userId, {
  items: [{ productId: '...', qty: 5 }],
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  idempotencyKey: 'unique-key-123', // Optional
});
```

### Database Constraint
- `idempotencyKey` has `@unique` constraint in Prisma schema
- Prevents duplicate keys at database level

## 8. CI/CD Safety

- Tests use SQLite in-memory database
- No production database connection required
- Fully isolated and deterministic
- Can run in CI without any external dependencies

## 9. Files Summary

### Modified Files
- `apps/api/prisma/schema.prisma` - Added idempotency key
- `apps/api/src/orders/orders.service.ts` - Idempotency support, DTO mapping
- `apps/api/src/orders/dto/create-order.dto.ts` - Added idempotency key field
- `apps/api/src/orders/dto/order.dto.ts` - Added cogsTotal field
- `apps/api/src/warehouse/fifo-allocation.service.ts` - Enhanced invariants
- `apps/api/test/setup.ts` - Improved test database setup
- `apps/api/test/warehouse-fifo.spec.ts` - Enhanced test suite
- `apps/api/test/helpers/warehouse-test-helpers.ts` - Fixed helper functions
- `apps/api/package.json` - Added test:setup script
- `apps/api/README-TESTING.md` - Updated documentation

### New Files
- `apps/api/scripts/setup-test-db.ts` - Test database setup script
- `apps/api/TEST_IMPLEMENTATION_SUMMARY.md` - This file

## 10. Next Steps

1. Run `pnpm test:setup` to initialize test database
2. Run `pnpm --filter api test` to verify all tests pass
3. Create migration for `idempotencyKey` field in production schema:
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name add_idempotency_key
   ```

## Notes

- All tests are deterministic and isolated
- No `any` types used (strict TypeScript)
- Test database is separate from production
- Runtime invariants only run in non-production environments
- Idempotency is backward-compatible (key is optional)

