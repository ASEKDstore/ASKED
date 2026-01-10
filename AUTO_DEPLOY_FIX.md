# Auto-Deploy Fix Summary

## 1. Diagnosis

**Most Likely Root Cause:**
- Missing CI-friendly install script (`install:ci`)
- Missing production start scripts in root package.json
- Web prebuild hook running lint:fix (can fail on warnings)
- API start script using dev mode instead of production
- Node version inconsistency (.nvmrc = 20, engines = >=18)
- Missing engines specification in individual packages

## 2. Concrete Plan

1. ✅ Add `install:ci` script for frozen lockfile installs
2. ✅ Add production `start` scripts (root, api, web)
3. ✅ Remove problematic `prebuild` lint hook from web
4. ✅ Fix API `start` to use production mode
5. ✅ Add shared package build step before apps
6. ✅ Standardize Node 20 across all packages
7. ✅ Add engines field to all packages

## 3. File-by-File Changes

### `package.json` (root)

```json
{
  "packageManager": "pnpm@10.23.0",
  "scripts": {
    "install:ci": "pnpm install --frozen-lockfile",
    "build": "pnpm --filter @asked-miniapp/shared build && pnpm --filter './apps/*' build",
    "build:api": "pnpm --filter @asked-miniapp/shared build && pnpm --filter api build",
    "build:web": "pnpm --filter @asked-miniapp/shared build && pnpm --filter web build",
    "start": "pnpm --filter api start:prod",
    "start:api": "pnpm --filter api start:prod",
    "start:web": "pnpm --filter web start"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

### `apps/api/package.json`

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "start": "node dist/main",
    "start:prod": "node dist/main"
  }
}
```

### `apps/web/package.json`

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "build": "next build"
    // Removed: "prebuild": "pnpm run lint:fix"
  }
}
```

### `apps/bot/package.json`

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

### `packages/shared/package.json`

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

## 4. Render Settings Checklist

### API Service

**Build & Deploy:**
- ✅ Build Command: `pnpm install:ci && pnpm build:api`
- ✅ Start Command: `pnpm start:api`
- ✅ Node Version: `20` (or leave empty for .nvmrc)
- ✅ Auto-Deploy: `Yes`
- ✅ Branch: `main`

**Pre-Deploy Command (optional):**
```bash
cd apps/api && pnpm prisma migrate deploy
```

### Web Service

**Build & Deploy:**
- ✅ Build Command: `pnpm install:ci && pnpm build:web`
- ✅ Start Command: `pnpm start:web`
- ✅ Node Version: `20`
- ✅ Auto-Deploy: `Yes`
- ✅ Branch: `main`

### Bot Service

**Build & Deploy:**
- ✅ Build Command: `pnpm install:ci && pnpm --filter bot build`
- ✅ Start Command: `pnpm --filter bot start`
- ✅ Node Version: `20`
- ✅ Auto-Deploy: `Yes`
- ✅ Branch: `main`

## 5. Verification Steps

### Local Verification

```bash
# 1. Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# 2. CI install test
pnpm install:ci

# 3. Build all
pnpm build

# 4. Build individual services
pnpm build:api
pnpm build:web
pnpm --filter bot build

# 5. Type check
pnpm typecheck

# 6. Test production start (API)
export DATABASE_URL="postgresql://..."
pnpm start:api

# 7. Test production start (Web)
export NEXT_PUBLIC_API_URL="http://localhost:3001"
pnpm start:web
```

### Render Logs - What to Check

**✅ Success Indicators:**
- `Installing dependencies with pnpm...`
- `Building @asked-miniapp/shared...`
- `Building api/web/bot...`
- `Prisma Client generated`
- `Nest application successfully started` (API)
- `Ready on http://0.0.0.0:PORT` (API)
- `Ready - started server on 0.0.0.0:PORT` (Web)

**❌ Error Indicators:**
- `Error: Cannot find module @asked-miniapp/shared` → Shared not built
- `Prisma Client not generated` → Prisma generate failed
- `Type error` → TypeScript compilation failed
- `Migration failed` → Database issue
- `Port already in use` → Port conflict

### Post-Deploy Verification

```bash
# API health check
curl https://asked-api.onrender.com/health

# Web check
curl -I https://asked-web.onrender.com

# Bot check (send /start to bot)
```

---

## Quick Reference

**Root commands:**
- `pnpm install:ci` - CI install
- `pnpm build:api` - Build API
- `pnpm build:web` - Build Web
- `pnpm start:api` - Start API (prod)
- `pnpm start:web` - Start Web (prod)

**Render Build Commands:**
- API: `pnpm install:ci && pnpm build:api`
- Web: `pnpm install:ci && pnpm build:web`
- Bot: `pnpm install:ci && pnpm --filter bot build`

**Render Start Commands:**
- API: `pnpm start:api`
- Web: `pnpm start:web`
- Bot: `pnpm --filter bot start`

