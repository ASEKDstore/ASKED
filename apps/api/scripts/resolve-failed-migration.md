# Разрешение failed migration P3009

## Проблема
Миграция `20250123000000_add_polet_system` упала в production из-за неправильного имени таблицы.
После исправления SQL Prisma блокирует новые миграции с ошибкой P3009.

## Решение

### Шаг 1: Подтвердить исправление миграции
Миграция уже исправлена:
- Все `REFERENCES "Product"` заменены на `REFERENCES "products"`
- Все `ALTER TABLE "Product"` заменены на `ALTER TABLE "products"`

### Шаг 2: Пометить failed migration как rolled back
Выполнить на production (Render) или локально с DATABASE_URL:

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250123000000_add_polet_system
```

Эта команда:
- Помечает миграцию как откаченную в таблице `_prisma_migrations`
- НЕ изменяет структуру БД
- Разблокирует применение новых миграций

### Шаг 3: Проверить статус миграций
```bash
pnpm prisma migrate status
```

Ожидаемый результат:
- Миграция `20250123000000_add_polet_system` больше не помечена как failed
- Можно применять новые миграции

### Шаг 4: Применить миграцию заново
```bash
pnpm prisma migrate deploy
```

Эта команда:
- Применит исправленную миграцию `20250123000000_add_polet_system`
- Создаст таблицы `polet` и `poziciya_poleta`
- Добавит колонки в таблицу `products`

## Важно
- Команда `prisma migrate resolve` изменяет только состояние в БД, не требует коммита
- Не нужно удалять или изменять файлы миграций
- Не нужно сбрасывать базу данных

