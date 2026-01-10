# Production Migration Fix Plan

## Problem Analysis

1. **Failed Migration**: `20250106000000_allow_guest_checkout` is an empty directory (no migration.sql file)
   - This causes Prisma to mark it as FAILED
   - Blocks all subsequent migrations (P3009 error)

2. **Missing Tables**: `banners`, `promo_pages`, `promo_media` don't exist in production database
   - Migration `20250107000000_banners_and_promos` exists but was never applied
   - Admin endpoints `/admin/banners` and `/admin/promos` crash with 500 errors

3. **Migration History**:
   - `20250105000000_init_products` - Initial schema (products, categories, tags)
   - `20250106000000_allow_guest_checkout` - **EMPTY** (FAILED)
   - `20250106000001_add_guest_checkout` - Makes orders.userId nullable (idempotent)
   - `20250107000000_banners_and_promos` - Creates banners/promos tables (pending)

## Solution Steps

### Step 1: Resolve Failed Migration

The empty migration `20250106000000_allow_guest_checkout` must be marked as rolled back.

**Command:**
```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout
```

**What this does:**
- Tells Prisma that this migration was rolled back (even though it never ran)
- Removes the FAILED status from `_prisma_migrations` table
- Allows subsequent migrations to proceed

**Safety:** ✅ Safe - the migration is empty, so marking it as rolled back has no effect on the database.

### Step 2: Apply Pending Migrations

After resolving the failed migration, apply all pending migrations.

**Command:**
```bash
cd apps/api
pnpm prisma migrate deploy
```

**What this does:**
- Applies `20250106000001_add_guest_checkout` (if not already applied)
- Applies `20250107000000_banners_and_promos` (creates banners/promos tables)
- Updates `_prisma_migrations` table

**Expected output:**
```
Applying migration `20250106000001_add_guest_checkout`
Applying migration `20250107000000_banners_and_promos`
```

**Safety:** ✅ Safe - `migrate deploy` only applies pending migrations, doesn't reset or delete data.

### Step 3: Verify Database State

Check that tables were created successfully.

**Command:**
```bash
cd apps/api
pnpm prisma migrate status
```

**Expected output:**
```
Database schema is up to date!
```

**Alternative verification (if you have DB access):**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('banners', 'promo_pages', 'promo_media');
```

Should return 3 rows.

### Step 4: Verify Prisma Schema Matches Database

Generate Prisma Client to ensure schema is in sync.

**Command:**
```bash
cd apps/api
pnpm prisma generate
```

**What this does:**
- Regenerates Prisma Client based on schema.prisma
- Ensures TypeScript types match database structure

### Step 5: Test Admin Endpoints

After migrations are applied, test the endpoints:

- `GET /admin/banners` - Should return empty array `{ items: [], total: 0, page: 1, pageSize: 10 }`
- `GET /admin/promos` - Should return empty array `[]`

**If endpoints still crash**, see Step 6 for defensive coding.

### Step 6: Add Defensive Error Handling (Optional but Recommended)

If you want to prevent 500 errors in the future when tables are missing, add try-catch blocks in services.

**File to modify:** `apps/api/src/admin/admin-banners.service.ts`

**Change in `findAll` method (line 27):**
```typescript
async findAll(query: BannerQueryDto): Promise<{ items: BannerDto[]; total: number; page: number; pageSize: number }> {
  const { q, isActive, page, pageSize } = query;

  const where: any = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { subtitle: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  try {
    const total = await this.prisma.banner.count({ where });
    const banners = await this.prisma.banner.findMany({
      where,
      orderBy: { sort: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items = banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      mediaType: banner.mediaType as 'IMAGE' | 'VIDEO',
      mediaUrl: banner.mediaUrl,
      isActive: banner.isActive,
      sort: banner.sort,
      promoSlug: banner.promoSlug,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    }));

    return { items, total, page, pageSize };
  } catch (error: any) {
    // Handle case where table doesn't exist yet
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return { items: [], total: 0, page, pageSize };
    }
    throw error;
  }
}
```

**File to modify:** `apps/api/src/admin/admin-promos.service.ts`

**Change in `findAll` method (line 11):**
```typescript
async findAll(): Promise<PromoDto[]> {
  try {
    const promos = await this.prisma.promoPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    return promos.map((promo) => ({
      id: promo.id,
      slug: promo.slug,
      title: promo.title,
      description: promo.description,
      isActive: promo.isActive,
      ctaType: promo.ctaType as 'PRODUCT' | 'URL',
      ctaText: promo.ctaText,
      ctaUrl: promo.ctaUrl,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
      media: promo.media.map((m) => ({
        id: m.id,
        promoId: m.promoId,
        mediaType: m.mediaType as 'IMAGE' | 'VIDEO',
        mediaUrl: m.mediaUrl,
        sort: m.sort,
      })),
    }));
  } catch (error: any) {
    // Handle case where table doesn't exist yet
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
}
```

**Note:** Step 6 is optional. After Step 2, the tables will exist and endpoints should work. This is just defensive coding for future safety.

## Execution Order

1. ✅ Resolve failed migration: `pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout`
2. ✅ Apply pending migrations: `pnpm prisma migrate deploy`
3. ✅ Verify status: `pnpm prisma migrate status`
4. ✅ Regenerate client: `pnpm prisma generate`
5. ✅ Test endpoints: `GET /admin/banners` and `GET /admin/promos`
6. ⚠️ (Optional) Add defensive error handling

## Safety Guarantees

- ✅ No data loss - `migrate resolve` and `migrate deploy` don't delete or modify existing data
- ✅ Idempotent - `20250106000001_add_guest_checkout` uses `IF NOT EXISTS` checks
- ✅ Production-safe - All commands are read-only or additive only
- ✅ Rollback possible - If something goes wrong, you can manually rollback by dropping the new tables

## Troubleshooting

**If `migrate resolve` fails:**
- Check that migration name matches exactly: `20250106000000_allow_guest_checkout`
- Verify you're in the `apps/api` directory

**If `migrate deploy` fails:**
- Check DATABASE_URL is correct
- Verify database connection
- Check if `20250106000001_add_guest_checkout` was already applied (check `_prisma_migrations` table)

**If tables still don't exist after deploy:**
- Manually run the SQL from `20250107000000_banners_and_promos/migration.sql`
- Check for permission issues

## Files to Inspect

1. `apps/api/prisma/migrations/20250106000000_allow_guest_checkout/` - Empty directory (expected)
2. `apps/api/prisma/migrations/20250106000001_add_guest_checkout/migration.sql` - Guest checkout migration
3. `apps/api/prisma/migrations/20250107000000_banners_and_promos/migration.sql` - Banners/promos migration
4. `apps/api/prisma/schema.prisma` - Prisma schema (should match migrations)






