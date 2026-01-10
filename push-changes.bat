@echo off
echo === Checking Git Status ===
git status --short

echo.
echo === Adding all changes ===
git add package.json
git add apps/api/package.json
git add apps/web/package.json
git add apps/bot/package.json
git add packages/shared/package.json
git add RENDER_SETTINGS.md
git add AUTO_DEPLOY_FIX.md

echo.
echo === Committing changes ===
git commit -m "fix: Restore reliable auto-deploy on Render" -m "- Add install:ci script for CI/CD" -m "- Add production start scripts (root, api, web)" -m "- Remove problematic prebuild lint hook from web" -m "- Fix API start to use production mode" -m "- Add shared package build step before apps" -m "- Standardize Node 20 across all packages" -m "- Add engines field to all packages"

echo.
echo === Pushing to origin main ===
git push origin main

echo.
echo === Done! ===
pause

