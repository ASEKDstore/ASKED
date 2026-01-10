# Быстрое исправление автодеплоя

## Если автодеплой не запустился, выполните:

### 1. Проверьте и выполните push (если не выполнен):

```bash
# Проверить статус
git status

# Добавить изменения
git add -A

# Закоммитить (если есть незакоммиченные изменения)
git commit -m "feat: Add inline button to subscription reminders with payment date update"

# Запушить
git push origin main
# или
git push origin master
```

### 2. Проверьте настройки Render Dashboard:

1. Откройте https://dashboard.render.com
2. Перейдите в ваш API Service
3. Settings → Build & Deploy:
   - ✅ **Auto-Deploy** должен быть **Enabled**
   - ✅ **Branch** должен быть правильным (`main` или `master`)
   - ✅ **Root Directory** должен быть пустым для монорепо

### 3. Добавьте недостающие переменные окружения в Render:

#### Для API Service (Settings → Environment):

```env
ADMIN_TG_ID=123456789
ADMIN_CHAT_ID=-1001234567890  # опционально
ADMIN_CHAT_THREAD_ID=5  # опционально, только для форумов
WEBAPP_URL=https://asked-web.onrender.com
```

#### Для Bot Service (Settings → Environment):

```env
WEBAPP_URL=https://asked-web.onrender.com
API_URL=https://asked-api.onrender.com
ADMIN_TG_ID=123456789
```

### 4. Запустите Manual Deploy (если нужно):

1. В Render Dashboard → ваш сервис
2. Нажмите **Manual Deploy** → **Deploy latest commit**

### 5. Получите ADMIN_CHAT_ID (если нужно):

1. Добавьте бота в группу как администратора
2. Отправьте `/debug_chat` в группе (только для админа)
3. Скопируйте значения из ответа бота

## Быстрая проверка после деплоя:

```bash
# Проверка API
curl https://asked-api.onrender.com/health

# Проверка бота (должен отвечать на /start)
# Отправьте /start боту в Telegram
```

---

**Если проблема не решена, проверьте логи в Render Dashboard → Logs**

