# Команды для выполнения на Render

## Проблема
Prisma блокирует деплой из-за failed migration `20250123000000_add_polet_system` (P3009).

## Решение

### Вариант 1: Выполнить команды вручную (рекомендуется)

Откройте **Render Shell** для вашего API service и выполните:

```bash
cd apps/api

# Шаг 1: Пометить failed migration как rolled back
pnpm prisma migrate resolve --rolled-back 20250123000000_add_polet_system

# Шаг 2: Проверить статус миграций
pnpm prisma migrate status

# Шаг 3: Применить миграции
pnpm prisma migrate deploy
```

### Вариант 2: Использовать скрипт

```bash
cd apps/api
chmod +x scripts/resolve-migration.sh
./scripts/resolve-migration.sh
```

### Вариант 3: Использовать TypeScript скрипт

```bash
cd apps/api
pnpm ts-node scripts/resolve-polet-migration.ts
pnpm prisma migrate deploy
```

## Ожидаемый результат

### После `prisma migrate resolve`:
```
Migration 20250123000000_add_polet_system marked as rolled back.
```

### После `prisma migrate status`:
```
Database schema is up to date!
```

### После `prisma migrate deploy`:
```
Applying migration `20250123000000_add_polet_system`
✅ The following migration(s) have been applied:
  - 20250123000000_add_polet_system
```

## Проверка успешности

1. ✅ `prisma migrate deploy` выполняется без ошибки P3009
2. ✅ API запускается без ошибок
3. ✅ Endpoint `GET /admin/polet` возвращает `200 OK`
4. ✅ Страница "Паллеты" в админке загружается

## Важно

- Эти команды изменяют только состояние БД (таблица `_prisma_migrations`)
- Не требуют коммита в git
- Исправленная миграция уже в репозитории (коммит `d3c2768`)
- После `resolve` миграция будет применена заново с исправленным SQL

