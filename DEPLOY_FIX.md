# Исправление автодеплоя на Render

## Проблема
Автодеплой не запустился после push изменений.

## Возможные причины и решения

### 1. Push не был выполнен

**Проверка:**
```bash
git status
git log --oneline -5
git remote -v
```

**Решение:**
Если изменения не запушены, выполните:
```bash
git add -A
git commit -m "feat: Add inline button to subscription reminders with payment date update"
git push origin main
# или
git push origin master
```

### 2. Render не получает webhook от Git

**Проверка в Render Dashboard:**
1. Откройте ваш сервис в Render Dashboard
2. Перейдите в **Settings** → **Build & Deploy**
3. Проверьте, что **Auto-Deploy** включен (Enabled)
4. Проверьте **Branch** (должен быть `main` или `master`)
5. Проверьте **Root Directory** (должен быть пустым или правильный путь для монорепо)

**Решение:**
- Если Auto-Deploy выключен, включите его
- Если Branch неправильный, измените на правильную ветку
- Переподключите Git репозиторий если нужно:
  1. Settings → Connect Git
  2. Выберите репозиторий и ветку заново

### 3. Недостающие переменные окружения

Для новых функций требуются дополнительные переменные:

#### Для API Service:
```env
# Уже должны быть:
DATABASE_URL=...
PORT=3001
FRONTEND_URL=https://asked-web.onrender.com
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...
ADMIN_PANEL_URL=https://asked-web.onrender.com
TELEGRAM_AUTH_MAX_AGE_SEC=86400

# НОВЫЕ (добавить):
ADMIN_TG_ID=123456789  # Telegram ID администратора
ADMIN_CHAT_ID=-1001234567890  # ID группы/чата для уведомлений (опционально)
ADMIN_CHAT_THREAD_ID=5  # ID топика в форуме (опционально, только для форумов)
WEBAPP_URL=https://asked-web.onrender.com  # URL веб-приложения для бота
```

#### Для Bot Service:
```env
# Уже должно быть:
TELEGRAM_BOT_TOKEN=...

# НОВЫЕ (добавить):
WEBAPP_URL=https://asked-web.onrender.com
API_URL=https://asked-api.onrender.com  # или NEXT_PUBLIC_API_URL если используется
ADMIN_TG_ID=123456789  # Telegram ID администратора
```

### 4. Как получить ADMIN_CHAT_ID и ADMIN_CHAT_THREAD_ID

**Используйте команду бота `/debug_chat`:**
1. Добавьте бота в группу/чат как администратора
2. Отправьте любое сообщение в группе
3. Выполните команду `/debug_chat` в группе (только админ)
4. Скопируйте значения из ответа бота

**Или из логов:**
- Бот автоматически логирует `chat_id` и `message_thread_id` для сообщений от админа

### 5. Ручной запуск деплоя

Если автодеплой не сработал, можно запустить вручную:

1. В Render Dashboard откройте ваш сервис
2. Нажмите **Manual Deploy** → **Deploy latest commit**
3. Или выберите конкретный коммит для деплоя

### 6. Проверка логов деплоя

После деплоя проверьте логи:

1. В Render Dashboard → Ваш сервис → **Logs**
2. Ищите ошибки:
   - `Error: TELEGRAM_BOT_TOKEN is missing`
   - `Migration failed`
   - `Build failed`
   - `Environment variable not found`

### 7. Проверка после деплоя

После успешного деплоя проверьте:

**API:**
```bash
curl https://asked-api.onrender.com/health
```

**Новый endpoint для бота:**
```bash
# Должен требовать x-bot-token header
curl -X POST https://asked-api.onrender.com/telegram/subscriptions/test-id/update-payment-date \
  -H "x-bot-token: YOUR_BOT_TOKEN"
```

**Бот:**
- Проверьте логи бота в Render Dashboard
- Отправьте `/start` боту в Telegram
- Попробуйте `/debug_chat` (только для админа)

## Шаги для исправления (чеклист)

- [ ] Выполнить `git push origin main` (если изменения не запушены)
- [ ] Проверить Auto-Deploy в Render Dashboard
- [ ] Добавить недостающие переменные окружения:
  - [ ] `ADMIN_TG_ID` в API Service
  - [ ] `ADMIN_CHAT_ID` в API Service (опционально)
  - [ ] `ADMIN_CHAT_THREAD_ID` в API Service (опционально)
  - [ ] `WEBAPP_URL` в API Service
  - [ ] `API_URL` в Bot Service
  - [ ] `WEBAPP_URL` в Bot Service
  - [ ] `ADMIN_TG_ID` в Bot Service
- [ ] Запустить Manual Deploy если нужно
- [ ] Проверить логи после деплоя
- [ ] Протестировать новые функции после деплоя

## Важные заметки

⚠️ **После добавления новых переменных окружения:**
- Render автоматически перезапустит сервисы
- Бот должен перезапуститься с новыми переменными
- API должен использовать новые переменные для отправки в админ-чат

⚠️ **Если автодеплой все еще не работает:**
- Проверьте настройки Git репозитория в Render
- Убедитесь, что webhook настроен правильно
- Попробуйте переподключить репозиторий
- Проверьте, что коммит действительно в удаленной ветке: `git log origin/main --oneline -5`

