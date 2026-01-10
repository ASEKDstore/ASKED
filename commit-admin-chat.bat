@echo off
echo ========================================
echo Committing Admin Chat Config changes
echo ========================================
echo.

echo Step 1: Checking Git Status
git status --short
echo.

echo Step 2: Adding all changes
git add -A
echo.

echo Step 3: Committing changes
git commit -m "feat(admin-chat): DB-based admin chat config and bot commands" -m "- Add AdminChatConfig Prisma model and migration" -m "- Add /set_admin_chat, /get_admin_chat, /clear_admin_chat bot commands" -m "- Store admin chat config in DB with ENV fallback" -m "- Unify admin chat notifications for orders and subscriptions" -m "- Keep backward compatibility with ENV variables"
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

