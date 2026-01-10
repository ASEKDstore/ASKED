# Инструкция: Как закоммитить и запушить изменения вручную

## Способ 1: Через PowerShell/CMD (в корне проекта)

Откройте PowerShell или CMD в папке проекта и выполните команды по порядку:

```bash
# 1. Проверяем статус (какие файлы изменены)
git status

# 2. Добавляем ВСЕ изменения в staging
git add -A

# 3. Создаем коммит с сообщением
git commit -m "feat(admin-chat): DB-based admin chat config and bot commands" -m "- Add AdminChatConfig Prisma model and migration" -m "- Add /set_admin_chat, /get_admin_chat, /clear_admin_chat bot commands" -m "- Store admin chat config in DB with ENV fallback" -m "- Unify admin chat notifications for orders and subscriptions" -m "- Keep backward compatibility with ENV variables"

# 4. Отправляем изменения на сервер
git push origin main

# 5. Проверяем результат
git status
git log -1 --oneline
```

## Способ 2: Через готовый batch файл

Я создал для вас готовый скрипт `commit-admin-chat.bat`. Просто запустите его:

```bash
.\commit-admin-chat.bat
```

## Способ 3: Пошагово с проверками

Если хотите контролировать каждый шаг:

```bash
# Шаг 1: Посмотреть что изменилось
git status --short

# Шаг 2: Добавить конкретные файлы (или все через -A)
git add apps/api/prisma/schema.prisma
git add apps/api/src/orders/admin-chat-config.service.ts
git add apps/api/src/orders/admin-chat-config-bot.controller.ts
git add apps/api/src/orders/orders.module.ts
git add apps/api/src/orders/telegram-bot.service.ts
git add apps/bot/src/index.ts
git add apps/api/prisma/migrations/20250113000000_add_admin_chat_config/migration.sql
# Или просто: git add -A

# Шаг 3: Проверить что добавлено
git status

# Шаг 4: Закоммитить
git commit -m "feat(admin-chat): DB-based admin chat config and bot commands" -m "- Add AdminChatConfig Prisma model and migration" -m "- Add /set_admin_chat, /get_admin_chat, /clear_admin_chat bot commands" -m "- Store admin chat config in DB with ENV fallback" -m "- Unify admin chat notifications for orders and subscriptions" -m "- Keep backward compatibility with ENV variables"

# Шаг 5: Запушить
git push origin main
```

## Если рабочее дерево чистое

Если после `git status` вы видите "working tree clean", значит все изменения уже закоммичены. Проверьте последний коммит:

```bash
git log -1 --oneline
```

## Если нужен простой коммит (одна строка)

```bash
git add -A
git commit -m "feat(admin-chat): DB admin chat config + bot commands"
git push origin main
```

## Возможные ошибки

**Ошибка: "nothing to commit, working tree clean"**
→ Все изменения уже закоммичены. Ничего делать не нужно.

**Ошибка: "failed to push some refs"**
→ Кто-то уже запушил изменения. Выполните:
```bash
git pull origin main
git push origin main
```

**Ошибка: "not a git repository"**
→ Вы не в корне проекта. Перейдите в папку `ASKED_APP`:
```bash
cd "C:\Users\Atlet\Desktop\ASKED project\ASKED_APP"
```

