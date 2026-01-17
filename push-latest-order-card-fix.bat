@echo off
echo ========================================
echo Committing latest order card fix
echo ========================================
echo.

echo Step 1: Checking Git Status
git status --short
echo.

echo Step 2: Adding files
git add apps/web/src/app/profile/page.tsx
echo.

echo Step 3: Committing changes
git commit -m "fix(web): add error handling and loading states for latest order card"
echo.

if %errorlevel% neq 0 (
    echo ERROR: Commit failed. Check the error message above.
    echo If you see "nothing to commit", all changes are already committed.
    pause
    exit /b 1
)

echo Step 4: Pushing to origin/main
git push origin main
echo.

if %errorlevel% neq 0 (
    echo ERROR: Push failed. You may need to pull first:
    echo   git pull origin main
    echo   git push origin main
    pause
    exit /b 1
)

echo Step 5: Final Status
git status --short
echo.

echo Step 6: Last Commit
git log -1 --oneline
echo.

echo ========================================
echo SUCCESS! Changes committed and pushed.
echo ========================================
pause




