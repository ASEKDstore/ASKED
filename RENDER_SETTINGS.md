# Render Auto-Deploy Configuration

## Diagnosis

**Root Cause:** Auto-deploy failures likely due to:
1. Missing `install:ci` script in root package.json
2. Missing production `start` script in root package.json
3. Web `prebuild` hook running lint:fix (can fail on warnings)
4. API `start` script using dev mode instead of production
5. Shared package not being built before apps
6. Node version mismatch (.nvmrc = 20, but engines = >=18)

## Fixed Issues

✅ Added `install:ci` script for CI/CD
✅ Added production `start` scripts (root, api, web)
✅ Removed `prebuild` lint hook from web (moved to optional)
✅ Fixed API `start` to use production mode
✅ Added shared package build step before apps
✅ Standardized Node 20 across all packages
✅ Added engines field to all packages

---

## Render Settings Checklist

### For API Service

**Settings → Build & Deploy:**

- **Build Command:** `pnpm install:ci && pnpm build:api`
- **Start Command:** `pnpm start:api`
- **Node Version:** `20` (or leave empty to use .nvmrc)
- **Auto-Deploy:** `Yes` (enabled)
- **Branch:** `main` (or your default branch)

**Settings → Environment:**

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Usually set automatically by Render (3001)
- `FRONTEND_URL` - https://asked-web.onrender.com
- `TELEGRAM_BOT_TOKEN` - Your bot token
- `TELEGRAM_ADMIN_CHAT_ID` - Admin chat ID
- `ADMIN_TG_ID` - Admin Telegram user ID
- `ADMIN_PANEL_URL` - https://asked-web.onrender.com
- `TELEGRAM_AUTH_MAX_AGE_SEC` - 86400
- `ADMIN_CHAT_ID` - (optional) Group chat ID
- `ADMIN_CHAT_THREAD_ID` - (optional) Forum thread ID
- `WEBAPP_URL` - https://asked-web.onrender.com

**Settings → Pre-Deploy Command (optional):**

If you need to run migrations before deploy:
```bash
cd apps/api && pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || true && pnpm prisma migrate resolve --rolled-back 20250123000000_add_polet_system || true && pnpm prisma migrate deploy && pnpm prisma generate
```

**Settings → Health Check Path (optional):**

- `/health` or `/` (if you have a health endpoint)

---

### For Web Service

**Settings → Build & Deploy:**

- **Build Command:** `pnpm install:ci && pnpm build:web`
- **Start Command:** `pnpm start:web`
- **Node Version:** `20` (or leave empty to use .nvmrc)
- **Auto-Deploy:** `Yes` (enabled)
- **Branch:** `main` (or your default branch)

**Settings → Environment:**

Required variables:
- `NEXT_PUBLIC_API_URL` - https://asked-api.onrender.com
- `NEXT_PUBLIC_APP_VERSION` - 1.0.0 (or your version)

---

### For Bot Service

**Settings → Build & Deploy:**

- **Build Command:** `pnpm install:ci && pnpm --filter bot build`
- **Start Command:** `pnpm --filter bot start`
- **Node Version:** `20` (or leave empty to use .nvmrc)
- **Auto-Deploy:** `Yes` (enabled)
- **Branch:** `main` (or your default branch)

**Settings → Environment:**

Required variables:
- `TELEGRAM_BOT_TOKEN` - Your bot token
- `WEBAPP_URL` - https://asked-web.onrender.com
- `API_URL` - https://asked-api.onrender.com
- `ADMIN_TG_ID` - Admin Telegram user ID

---

## Verification Steps

### Local Verification

**1. Clean install:**
```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

**2. Build all apps:**
```bash
pnpm build
```

**3. Build individual services:**
```bash
# API only
pnpm build:api

# Web only
pnpm build:web

# Bot only
pnpm --filter bot build
```

**4. Type check:**
```bash
pnpm typecheck
```

**5. Test production start (API):**
```bash
# Set DATABASE_URL first
export DATABASE_URL="postgresql://..."
pnpm start:api
```

**6. Test production start (Web):**
```bash
# Set NEXT_PUBLIC_API_URL first
export NEXT_PUBLIC_API_URL="http://localhost:3001"
pnpm start:web
```

### Render Logs Checklist

After deploy, check logs for:

**✅ Success indicators:**
- `Installing dependencies...`
- `Building shared package...`
- `Building api/web/bot...`
- `Prisma Client generated`
- `Nest application successfully started` (for API)
- `Ready on http://0.0.0.0:PORT` (for API)
- `Ready - started server on 0.0.0.0:PORT` (for Web)

**❌ Error indicators:**
- `Error: Cannot find module` - Missing dependency or shared package not built
- `Prisma Client not generated` - Prisma generate failed
- `Type error` - TypeScript compilation failed
- `ESLint errors` - Linting failed (should not block build now)
- `Migration failed` - Database migration issue
- `Port already in use` - Another process using the port

### Common Issues & Fixes

**Issue: "Cannot find module @asked-miniapp/shared"**
- **Fix:** Ensure shared package is built before apps
- **Check:** Build command should include `pnpm --filter @asked-miniapp/shared build`

**Issue: "Prisma Client not found"**
- **Fix:** Ensure `prisma generate` runs in postinstall or build
- **Check:** API package.json has `postinstall: "prisma generate"`

**Issue: "Build timeout"**
- **Fix:** Remove lint from prebuild hooks
- **Check:** Web package.json should not have `prebuild` with lint

**Issue: "Node version mismatch"**
- **Fix:** Set Node version to 20 in Render settings or use .nvmrc
- **Check:** .nvmrc contains `20`

**Issue: "Auto-deploy not triggering"**
- **Fix:** Check Auto-Deploy is enabled and branch is correct
- **Check:** Verify webhook is connected in Render → Settings → Git

---

## File Changes Summary

### Root `package.json`
- ✅ Added `install:ci` script
- ✅ Added `build:api` and `build:web` scripts
- ✅ Added `start`, `start:api`, `start:web` scripts
- ✅ Updated `build` to include shared package
- ✅ Updated engines to Node >=20.0.0, pnpm >=10.0.0

### `apps/api/package.json`
- ✅ Added engines field
- ✅ Fixed `start` to use production mode (`node dist/main`)

### `apps/web/package.json`
- ✅ Added engines field
- ✅ Removed `prebuild` hook (lint:fix moved to optional)

### `apps/bot/package.json`
- ✅ Added engines field

### `packages/shared/package.json`
- ✅ Added engines field

---

## Next Steps

1. Update Render settings for each service (API, Web, Bot)
2. Test local build with `pnpm install:ci && pnpm build:api`
3. Push changes to trigger auto-deploy
4. Monitor Render logs for success/errors
5. Verify services are running after deploy

