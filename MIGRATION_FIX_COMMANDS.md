# Exact Commands to Fix Production Migration Issue

## Prerequisites
- Access to Render API service (via Render Dashboard or CLI)
- DATABASE_URL environment variable configured
- pnpm installed

## Step-by-Step Execution

### Step 1: Resolve Failed Migration

**Location:** Render API service shell or local terminal with DATABASE_URL set

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout
```

**Expected output:**
```
Migration 20250106000000_allow_guest_checkout marked as rolled back.
```

**What this does:**
- Removes FAILED status from `_prisma_migrations` table
- Allows subsequent migrations to proceed
- Safe because the migration is empty (no SQL to execute)

---

### Step 2: Apply Pending Migrations

**Command:**
```bash
cd apps/api
pnpm prisma migrate deploy
```

**Expected output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database

Applying migration `20250106000001_add_guest_checkout`
Applying migration `20250107000000_banners_and_promos`

The following migration(s) have been applied:

migrations/
  └─ 20250106000001_add_guest_checkout/
  └─ 20250107000000_banners_and_promos/

All migrations have been successfully applied.
```

**What this does:**
- Applies `20250106000001_add_guest_checkout` (makes orders.userId nullable)
- Applies `20250107000000_banners_and_promos` (creates banners, promo_pages, promo_media tables)
- Updates `_prisma_migrations` table

---

### Step 3: Verify Migration Status

**Command:**
```bash
cd apps/api
pnpm prisma migrate status
```

**Expected output:**
```
Database schema is up to date!

Following migrations have been applied:

migrations/
  └─ 20250105000000_init_products/
  └─ 20250106000000_allow_guest_checkout/ (rolled back)
  └─ 20250106000001_add_guest_checkout/
  └─ 20250107000000_banners_and_promos/

All migrations have been successfully applied.
```

---

### Step 4: Regenerate Prisma Client

**Command:**
```bash
cd apps/api
pnpm prisma generate
```

**Expected output:**
```
Prisma schema loaded from prisma/schema.prisma
Generating Prisma Client (use --generator client to specify)
✔ Generated Prisma Client (version 5.x.x) to ./node_modules/.prisma/client in XXXms
```

**What this does:**
- Regenerates Prisma Client with Banner, PromoPage, PromoMedia models
- Updates TypeScript types

---

### Step 5: Verify Tables Exist (Optional)

If you have direct database access, verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('banners', 'promo_pages', 'promo_media')
ORDER BY table_name;
```

**Expected output:**
```
 table_name
------------
 banners
 promo_media
 promo_pages
(3 rows)
```

---

### Step 6: Test Admin Endpoints

After migrations are applied, test the endpoints:

**Test banners endpoint:**
```bash
curl -X GET "https://asked-api.onrender.com/admin/banners" \
  -H "Authorization: Bearer YOUR_DEV_TOKEN"
```

**Expected response:**
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 10
}
```

**Test promos endpoint:**
```bash
curl -X GET "https://asked-api.onrender.com/admin/promos" \
  -H "Authorization: Bearer YOUR_DEV_TOKEN"
```

**Expected response:**
```json
[]
```

---

## If Running on Render

### Option A: Using Render Dashboard

1. Go to Render Dashboard → Your API Service
2. Open "Shell" tab (if available)
3. Run commands from Steps 1-4 above

### Option B: Using Render CLI

```bash
# Install Render CLI if needed
npm install -g render-cli

# Login
render login

# Connect to service shell
render service:shell YOUR_API_SERVICE_ID

# Then run commands from Steps 1-4
```

### Option C: Using Pre-Deploy Command (Automatic)

If Render Web Shell is blocked, you can add these commands to the **Pre-Deploy Command** in Render Dashboard:

```bash
cd apps/api && pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || true && pnpm prisma migrate deploy && pnpm prisma generate
```

**Note:** The `|| true` ensures that if the migration is already resolved, the command doesn't fail.

---

## Troubleshooting

### Error: "Migration X is not in a failed state"

**Solution:** The migration might already be resolved. Skip Step 1 and go directly to Step 2.

### Error: "Migration X has already been applied"

**Solution:** This is normal for `20250106000001_add_guest_checkout` if it was already applied. The command will skip it and apply only pending migrations.

### Error: "Table already exists"

**Solution:** The migration might have been partially applied. Check which tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('banners', 'promo_pages', 'promo_media');
```

If tables exist but migration is not marked as applied, manually mark it:
```bash
pnpm prisma migrate resolve --applied 20250107000000_banners_and_promos
```

### Error: "Connection refused" or "Database connection failed"

**Solution:** 
- Verify DATABASE_URL is set correctly in Render Dashboard
- Check database is running and accessible
- Verify network/firewall settings

---

## Rollback Plan (If Needed)

If something goes wrong and you need to rollback:

1. **Drop the new tables** (only if they were just created and empty):
```sql
DROP TABLE IF EXISTS promo_media CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS promo_pages CASCADE;
DROP TYPE IF EXISTS "BannerMediaType" CASCADE;
DROP TYPE IF EXISTS "PromoCtaType" CASCADE;
```

2. **Mark migration as rolled back:**
```bash
pnpm prisma migrate resolve --rolled-back 20250107000000_banners_and_promos
```

**⚠️ Warning:** Only do this if tables are empty and no data will be lost!

---

## Summary

1. ✅ Resolve failed empty migration
2. ✅ Apply pending migrations (creates banners/promos tables)
3. ✅ Verify status
4. ✅ Regenerate Prisma Client
5. ✅ Test endpoints

**Total time:** ~2-5 minutes
**Risk level:** Low (all operations are additive, no data deletion)


