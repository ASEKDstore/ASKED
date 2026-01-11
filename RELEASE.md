# Release Process

This document describes the versioning and release process for ASKED Miniapp.

## Version Management

- **Single Source of Truth**: Version is managed in `apps/web/package.json`
- The version is automatically exposed to Next.js via `NEXT_PUBLIC_APP_VERSION` in `next.config.js`
- API version is managed in `apps/api/package.json` and should match the web version

## Creating a Release

### 1. Update Version

Update the version in `apps/web/package.json` and `apps/api/package.json`:

```json
{
  "version": "1.0.1"
}
```

### 2. Commit Changes

```bash
git add apps/web/package.json apps/api/package.json
git commit -m "chore: bump version to 1.0.1"
```

### 3. Create Git Tag

Create an annotated tag for the release:

```bash
git tag -a v1.0.1 -m "Release v1.0.1"
```

Or with additional details:

```bash
git tag -a v1.0.1 -m "Release v1.0.1

- Feature X
- Bug fix Y
- Performance improvements"
```

### 4. Push Tag to Remote

```bash
git push origin v1.0.1
```

Or push all tags:

```bash
git push origin --tags
```

### 5. Push Commit to Main

```bash
git push origin main
```

## Deployment on Render

### Standard Deployment

1. Render automatically deploys from the `main` branch
2. After pushing the tag and commit, Render will trigger a new deployment
3. The version will be visible in the footer of the web app

### Manual Deployment from Tag

If you need to deploy a specific release:

1. Go to Render dashboard
2. Select your service (web or api)
3. Go to "Manual Deploy"
4. Select the commit hash or tag (e.g., `v1.0.1`)
5. Click "Deploy"

### Environment Variables

- `NEXT_PUBLIC_APP_VERSION` is automatically set from `package.json` during build
- `APP_VERSION` (for API) can be set in Render env vars, but defaults to `package.json` version
- `WEB_VERSION` (optional) can be set to override web version in API `/health` endpoint

## Rollback Procedure

### Option 1: Deploy Previous Tag (Recommended)

1. Identify the last good version tag:
   ```bash
   git tag --list -n1 | tail -5
   ```

2. In Render dashboard:
   - Go to your service
   - Manual Deploy → Select the previous tag (e.g., `v1.0.0`)
   - Deploy

3. Verify the deployment:
   - Check `/health` endpoint for API version
   - Check footer in web app for version

### Option 2: Create Revert Commit

If you need to revert changes on `main`:

1. Identify the commit to revert:
   ```bash
   git log --oneline -10
   ```

2. Create a revert commit:
   ```bash
   git revert <commit-hash>
   ```

3. Create a new patch version tag:
   ```bash
   git tag -a v1.0.2 -m "Rollback to fix issue in v1.0.1"
   git push origin v1.0.2
   git push origin main
   ```

4. Render will auto-deploy from `main`

### Option 3: Quick Hotfix

1. Create a hotfix branch from the last good tag:
   ```bash
   git checkout -b hotfix/v1.0.2 v1.0.0
   ```

2. Apply the fix and commit:
   ```bash
   # Make fixes
   git add .
   git commit -m "fix: critical bug fix"
   ```

3. Update version and tag:
   ```bash
   # Update package.json version to 1.0.2
   git add apps/web/package.json apps/api/package.json
   git commit -m "chore: bump version to 1.0.2"
   git tag -a v1.0.2 -m "Hotfix v1.0.2"
   ```

4. Merge to main and push:
   ```bash
   git checkout main
   git merge hotfix/v1.0.2
   git push origin main
   git push origin v1.0.2
   ```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Examples

- `1.0.0` → `1.0.1`: Patch release (bug fix)
- `1.0.1` → `1.1.0`: Minor release (new feature)
- `1.1.0` → `2.0.0`: Major release (breaking change)

## Verification

After deployment, verify:

1. **Web App**:
   - Check footer displays correct version: "Version 1.0.1"
   - Verify app functionality

2. **API**:
   - Check `/health` endpoint:
     ```bash
     curl https://your-api.onrender.com/health
     ```
   - Should return:
     ```json
     {
       "status": "ok",
       "timestamp": "2024-01-01T00:00:00.000Z",
       "apiVersion": "1.0.1",
       "webVersion": "1.0.1"
     }
     ```

3. **Build**:
   ```bash
   pnpm --filter web build
   pnpm --filter api build
   ```

## Checklist

Before creating a release:

- [ ] All tests pass
- [ ] Version updated in `apps/web/package.json`
- [ ] Version updated in `apps/api/package.json`
- [ ] Changes documented (if applicable)
- [ ] Git tag created with proper message
- [ ] Tag pushed to remote
- [ ] Commit pushed to `main`
- [ ] Deployment verified in Render
- [ ] Health endpoint verified
- [ ] Footer version verified

