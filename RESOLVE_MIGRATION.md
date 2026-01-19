# Разрешение Failed Migration P3009

## Проблема
Миграция `20250123000000_add_polet_system` упала в production из-за неправильного имени таблицы.
После исправления SQL Prisma блокирует новые миграции с ошибкой P3009.

## Решение

### Шаг 1: Подтвердить исправление миграции ✅
Миграция уже исправлена в коммите `d3c2768`:
- Все `REFERENCES "Product"` заменены на `REFERENCES "products"`
- Все `ALTER TABLE "Product"` заменены на `ALTER TABLE "products"`

### Шаг 2: Пометить failed migration как rolled back

**Вариант A: Использовать Prisma CLI (рекомендуется)**

Выполнить на Render через SSH или в консоли:

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250123000000_add_polet_system
```

**Вариант B: Использовать скрипт**

```bash
cd apps/api
pnpm ts-node scripts/resolve-polet-migration.ts
```

### Шаг 3: Проверить статус миграций

```bash
cd apps/api
pnpm prisma migrate status
```

Ожидаемый результат:
- Миграция `20250123000000_add_polet_system` больше не помечена как failed
- Можно применять новые миграции

### Шаг 4: Применить миграцию заново

```bash
cd apps/api
pnpm prisma migrate deploy
```

Эта команда:
- Применит исправленную миграцию `20250123000000_add_polet_system`
- Создаст таблицы `polet` и `poziciya_poleta`
- Добавит колонки `sourcePoletId` и `sourcePoziciyaPoletaId` в таблицу `products`

## Выполнение на Render

### Через Render Shell (SSH):
1. Откройте Render Dashboard
2. Выберите ваш API service
3. Нажмите "Shell" или "SSH"
4. Выполните команды из Шага 2-4

### Через Render Console:
1. Откройте Render Dashboard
2. Выберите ваш API service
3. Перейдите в "Environment" → "Shell Command"
4. Выполните команды из Шага 2-4

## Важно
- Команда `prisma migrate resolve` изменяет только состояние в БД (таблица `_prisma_migrations`), не требует коммита
- Не нужно удалять или изменять файлы миграций
- Не нужно сбрасывать базу данных
- После выполнения команды `resolve`, следующее применение миграций (`migrate deploy`) применит исправленную миграцию

## Проверка после применения

1. API должен запуститься без ошибок
2. Endpoint `GET /admin/polet` должен возвращать `200 OK` (даже если список пустой)
3. Страница "Паллеты" в админке должна загружаться без ошибок

