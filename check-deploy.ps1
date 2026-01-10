# Скрипт для проверки и исправления проблемы с автодеплоем

Write-Host "=== Проверка Git статуса ===" -ForegroundColor Cyan
git status --short

Write-Host "`n=== Незакоммиченные изменения ===" -ForegroundColor Cyan
$unstaged = git diff --name-only
$staged = git diff --cached --name-only

if ($unstaged -or $staged) {
    Write-Host "Найдены незакоммиченные изменения:" -ForegroundColor Yellow
    if ($unstaged) {
        Write-Host "Не добавлены в staging:" -ForegroundColor Yellow
        $unstaged | ForEach-Object { Write-Host "  - $_" }
    }
    if ($staged) {
        Write-Host "Добавлены в staging (нужен commit):" -ForegroundColor Yellow
        $staged | ForEach-Object { Write-Host "  - $_" }
    }
} else {
    Write-Host "Все изменения закоммичены" -ForegroundColor Green
}

Write-Host "`n=== Последние коммиты ===" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n=== Remote репозиторий ===" -ForegroundColor Cyan
git remote -v

Write-Host "`n=== Проверка push ===" -ForegroundColor Cyan
$currentBranch = git branch --show-current
Write-Host "Текущая ветка: $currentBranch" -ForegroundColor Yellow

$behind = git rev-list --count HEAD..origin/$currentBranch 2>$null
$ahead = git rev-list --count origin/$currentBranch..HEAD 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Не удалось проверить статус с remote (возможно, ветка не существует на remote)" -ForegroundColor Red
} else {
    if ($behind -gt 0) {
        Write-Host "Ветка отстает от origin/$currentBranch на $behind коммитов" -ForegroundColor Yellow
    }
    if ($ahead -gt 0) {
        Write-Host "Ветка впереди origin/$currentBranch на $ahead коммитов (нужен push)" -ForegroundColor Yellow
        Write-Host "`nВыполнить push? (y/n)" -ForegroundColor Cyan
        $response = Read-Host
        if ($response -eq 'y' -or $response -eq 'Y') {
            git push origin $currentBranch
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Push выполнен успешно!" -ForegroundColor Green
            } else {
                Write-Host "Ошибка при push" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Ветка синхронизирована с remote" -ForegroundColor Green
    }
}

Write-Host "`n=== Рекомендации ===" -ForegroundColor Cyan
Write-Host "1. Проверьте Auto-Deploy в Render Dashboard" -ForegroundColor White
Write-Host "2. Убедитесь, что все переменные окружения добавлены (см. DEPLOY_FIX.md)" -ForegroundColor White
Write-Host "3. Если нужно, запустите Manual Deploy в Render" -ForegroundColor White

