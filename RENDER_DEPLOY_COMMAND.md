# Команды для Render Pre-Deploy Command

## Вариант 1: Однострочная команда (рекомендуется)

Скопируйте эту команду в **Pre-Deploy Command** в настройках вашего API сервиса в Render Dashboard:

```bash
cd apps/api && pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || true && pnpm prisma migrate deploy && pnpm prisma generate
```

**Что делает:**
- `|| true` - игнорирует ошибку, если миграция уже разрешена
- Применяет все pending миграции
- Регенерирует Prisma Client

---

## Вариант 2: Многострочная команда (для читаемости)

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || true
pnpm prisma migrate deploy
pnpm prisma generate
```

---

## Вариант 3: Использование скрипта

Если вы хотите использовать скрипт `apps/api/fix-migrations.sh`:

```bash
chmod +x apps/api/fix-migrations.sh && apps/api/fix-migrations.sh
```

---

## Где добавить команду в Render

1. Откройте Render Dashboard
2. Перейдите в ваш **API Service**
3. Откройте вкладку **Settings**
4. Найдите секцию **Build & Deploy**
5. Вставьте команду в поле **Pre-Deploy Command**
6. Сохраните изменения
7. Запустите новый деплой (или он запустится автоматически при следующем push)

---

## Проверка после деплоя

После успешного деплоя проверьте логи:

1. В Render Dashboard → Your API Service → Logs
2. Ищите строки:
   - `Migration 20250106000000_allow_guest_checkout marked as rolled back`
   - `Applying migration 20250107000000_banners_and_promos`
   - `All migrations have been successfully applied`

---

## Альтернатива: Выполнение через Render Shell

Если у вас есть доступ к Render Shell:

1. Откройте Render Dashboard → Your API Service
2. Нажмите **Shell** (если доступно)
3. Выполните команды:

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout
pnpm prisma migrate deploy
pnpm prisma migrate status
pnpm prisma generate
```

---

## Важно

- ⚠️ Эти команды должны выполняться на **production сервере** (Render), где есть доступ к production базе данных
- ⚠️ Локально эти команды не сработают без настройки DATABASE_URL
- ✅ Pre-Deploy Command выполняется автоматически при каждом деплое
- ✅ Безопасно для production (не удаляет данные)

