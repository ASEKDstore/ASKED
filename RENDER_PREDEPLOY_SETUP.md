# Render Pre-Deploy Setup

## Проблема
Render блокирует деплой из-за failed migration `20250123000000_add_polet_system` (P3009).
Нет доступа к Render Shell для ручного разрешения.

## Решение
Создан единый скрипт `apps/api/scripts/render-predeploy.sh`, который автоматически:
1. Разрешает обе failed миграции (идемпотентно)
2. Применяет все pending миграции
3. Регенерирует Prisma Client

## Варианты настройки

### Вариант 1: Через Render Dashboard (рекомендуется)

1. Откройте Render Dashboard
2. Выберите ваш **API Service**
3. Перейдите в **Settings** → **Build & Deploy**
4. Найдите поле **Pre-Deploy Command**
5. Вставьте одну из команд:

**Вариант A (прямой вызов скрипта):**
```bash
bash apps/api/scripts/render-predeploy.sh
```

**Вариант B (через pnpm script):**
```bash
cd apps/api && pnpm predeploy:render
```

6. Сохраните изменения
7. Запустите новый деплой (или он запустится автоматически при следующем push)

### Вариант 2: Через render.yaml (Blueprint)

Если вы используете Render Blueprint (render.yaml):

1. Файл `render.yaml` уже создан в корне репозитория
2. Он содержит настройку `preDeployCommand: bash apps/api/scripts/render-predeploy.sh`
3. При деплое через Blueprint команда выполнится автоматически

**Примечание:** Если вы не используете Blueprint, используйте Вариант 1.

## Что делает скрипт

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Разрешаем первую failed migration (если нужно)
pnpm prisma migrate resolve --rolled-back 20250106000000_allow_guest_checkout || true

# Разрешаем вторую failed migration (если нужно)
pnpm prisma migrate resolve --rolled-back 20250123000000_add_polet_system || true

# Применяем все pending миграции
pnpm prisma migrate deploy

# Регенерируем Prisma Client
pnpm prisma generate

echo "Predeploy done"
```

## Безопасность

- ✅ **Идемпотентно**: `|| true` гарантирует, что если миграция уже разрешена, команда не упадет
- ✅ **Безопасно для production**: Не удаляет данные, не сбрасывает БД
- ✅ **Автоматически**: Выполняется при каждом деплое без ручного вмешательства

## Проверка после деплоя

После успешного деплоя проверьте логи в Render Dashboard:

**Ожидаемые сообщения:**
```
Migration 20250106000000_allow_guest_checkout marked as rolled back
Migration 20250123000000_add_polet_system marked as rolled back
Applying migration `20250123000000_add_polet_system`
All migrations have been successfully applied
Prisma Client generated
Predeploy done
```

**Успешный деплой:**
- ✅ Pre-deploy проходит без ошибки P3009
- ✅ `prisma migrate deploy` выполняется успешно
- ✅ API запускается без ошибок
- ✅ Endpoint `GET /admin/polet` возвращает `200 OK`

## Troubleshooting

**Если скрипт не выполняется:**
1. Проверьте, что путь к скрипту правильный: `bash apps/api/scripts/render-predeploy.sh`
2. Убедитесь, что скрипт имеет права на выполнение (Render обычно обрабатывает это автоматически)
3. Проверьте логи в Render Dashboard для деталей ошибки

**Если миграция все еще failed:**
1. Проверьте логи, чтобы увидеть точную ошибку
2. Убедитесь, что исправленная миграция в репозитории (коммит `d3c2768`)
3. Проверьте, что таблица `products` существует в БД

## Файлы

- `apps/api/scripts/render-predeploy.sh` - основной скрипт
- `apps/api/package.json` - добавлен скрипт `predeploy:render`
- `render.yaml` - Blueprint конфигурация (опционально)

