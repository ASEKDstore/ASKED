# Production Environment Variables

## 🌐 Production URLs

- **Web App**: https://asked-web.onrender.com
- **API**: https://asked-api.onrender.com

---

## 🔧 apps/api/.env (Production)

```env
# Database
DATABASE_URL="postgresql://asked_postgre_user:95V87ZoCCeT7ocNVq4XNWsywyjtAz3Bx@dpg-d5dcnvali9vc73dg0do0-a/asked_postgre"

# Server
PORT=3001
FRONTEND_URL=https://asked-web.onrender.com

# Telegram
TELEGRAM_BOT_TOKEN=8059531981:AAGyK0er4V4Atif1z__DawxMP0Y6VvqdLOA
TELEGRAM_AUTH_MAX_AGE_SEC=86400
```

**Важно:** `FRONTEND_URL` должен указывать на production URL фронтенда для правильной работы CORS.

---

## 🌐 apps/web/.env.local (Production)

```env
# API URL - указывает на production API
NEXT_PUBLIC_API_URL=https://asked-api.onrender.com

# App Version
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Важно:** `NEXT_PUBLIC_API_URL` должен указывать на production URL API для правильной работы запросов.

---

## 🤖 apps/bot/.env (Production)

```env
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=8059531981:AAGyK0er4V4Atif1z__DawxMP0Y6VvqdLOA
```

> ⚠️ **Важно:** Если `TELEGRAM_BOT_TOKEN` отсутствует или пустой, бот выведет сообщение "TELEGRAM_BOT_TOKEN is missing; bot is not started" и корректно завершит работу с кодом 0.

---

## 📝 Настройка на Render

### Для Web Service:
1. В Render Dashboard перейдите в настройки вашего Web Service
2. Добавьте Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://asked-api.onrender.com`
   - `NEXT_PUBLIC_APP_VERSION=1.0.0`

### Для API Service:
1. В Render Dashboard перейдите в настройки вашего API Service
2. Добавьте Environment Variables:
   - `DATABASE_URL=postgresql://asked_postgre_user:95V87ZoCCeT7ocNVq4XNWsywyjtAz3Bx@dpg-d5dcnvali9vc73dg0do0-a/asked_postgre`
   - `PORT=3001` (обычно Render автоматически устанавливает PORT)
   - `FRONTEND_URL=https://asked-web.onrender.com`
   - `TELEGRAM_BOT_TOKEN=8059531981:AAGyK0er4V4Atif1z__DawxMP0Y6VvqdLOA`
   - `TELEGRAM_AUTH_MAX_AGE_SEC=86400`

### Для Bot Service:
1. В Render Dashboard перейдите в настройки вашего Bot Service
2. Добавьте Environment Variables:
   - `TELEGRAM_BOT_TOKEN=8059531981:AAGyK0er4V4Atif1z__DawxMP0Y6VvqdLOA`

> ⚠️ **Важно:** Используйте `TELEGRAM_BOT_TOKEN` (не `BOT_TOKEN`). Если токен отсутствует, бот корректно завершит работу.

---

## ✅ Проверка

После настройки переменных окружения:

1. **API** должен быть доступен по: https://asked-api.onrender.com
2. **Web** должен быть доступен по: https://asked-web.onrender.com
3. Проверьте health endpoint: https://asked-api.onrender.com/health
4. Проверьте, что CORS настроен правильно (API принимает запросы от Web)

---

## 🔒 Безопасность

⚠️ **Важно:**
- Не коммитьте `.env` файлы с реальными credentials
- Используйте Environment Variables в Render Dashboard
- Регулярно ротируйте токены и пароли
- Используйте разные токены для dev и production

