@echo off
echo === Pushing to main branch ===
git status --short
echo.
echo === Adding all changes ===
git add -A
echo.
echo === Committing ===
git commit -m "feat: Add inline button to subscription reminders with payment date update"
echo.
echo === Pushing to origin main ===
git push origin main
echo.
echo === Push complete! ===
pause

