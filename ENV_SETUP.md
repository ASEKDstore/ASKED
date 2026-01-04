# Настройка переменных окружения

## 📋 Обзор

В монорепозитории нужно создать 3 файла с переменными окружения для каждого приложения.

---

## 🔧 apps/api/.env

Создайте файл `apps/api/.env` со следующими переменными:

```env
# База данных PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/asked_db?schema=public"

# Порт API сервера (по умолчанию 3001)
PORT=3001

# URL фронтенда для CORS (по умолчанию http://localhost:3000)
FRONTEND_URL=http://localhost:3000

# Токен Telegram бота (обязательно!)
# Получить можно у @BotFather в Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Максимальный возраст auth_date в секундах (по умолчанию 86400 = 24 часа)
TELEGRAM_AUTH_MAX_AGE_SEC=86400
```

### Как получить TELEGRAM_BOT_TOKEN:
1. Откройте Telegram
2. Найдите бота [@BotFather](https://t.me/BotFather)
3. Отправьте команду `/newbot`
4. Следуйте инструкциям
5. Скопируйте полученный токен

---

## 🌐 apps/web/.env.local

Создайте файл `apps/web/.env.local`:

```env
# URL API бэкенда
NEXT_PUBLIC_API_URL=http://localhost:3001

# Версия приложения (отображается в Footer)
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> **Примечание:** Переменные с префиксом `NEXT_PUBLIC_` доступны в браузере.

---

## 🤖 apps/bot/.env

Создайте файл `apps/bot/.env`:

```env
# Токен Telegram бота (обязательно!)
# Можно использовать тот же токен, что и в API, или создать отдельного бота
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

> ⚠️ **Важно:** 
> - Бот использует переменную `TELEGRAM_BOT_TOKEN` (не `BOT_TOKEN`)
> - Если токен отсутствует или пустой, бот корректно завершит работу с кодом 0
> - Это предотвращает падение worker на Render при отсутствии токена

---

## ⚙️ Настройка базы данных

### 1. Установите PostgreSQL
Если PostgreSQL еще не установлен:
- Windows: [PostgreSQL для Windows](https://www.postgresql.org/download/windows/)
- macOS: `brew install postgresql` или [PostgreSQL.app](https://postgresapp.com/)
- Linux: `sudo apt-get install postgresql` (Ubuntu/Debian)

### 2. Создайте базу данных

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE asked_db;

# Создайте пользователя (опционально)
CREATE USER asked_user WITH PASSWORD 'your_password';

# Дайте права пользователю
GRANT ALL PRIVILEGES ON DATABASE asked_db TO asked_user;

# Выйдите
\q
```

### 3. Обновите DATABASE_URL

В `apps/api/.env` укажите правильные данные:

```env
DATABASE_URL="postgresql://asked_user:your_password@localhost:5432/asked_db?schema=public"
```

### 4. Примените миграции

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
```

---

## 🚀 Быстрый старт

1. **Создайте все .env файлы** (скопируйте примеры выше)

2. **Настройте DATABASE_URL** в `apps/api/.env`

3. **Получите TELEGRAM_BOT_TOKEN** у @BotFather

4. **Запустите миграции**:
   ```bash
   pnpm --filter api prisma:migrate
   ```

5. **Запустите приложения**:
   ```bash
   pnpm dev
   ```

---

## 🔒 Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте `.env` файлы в Git
- Файлы `.env` уже добавлены в `.gitignore`
- Используйте разные токены для production и development
- Не делитесь токенами публично

---

## 📝 Примеры для разных окружений

### Development (локально)
```env
# apps/api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asked_db_dev?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_AUTH_MAX_AGE_SEC=86400
```

### Production
```env
# apps/api/.env
DATABASE_URL="postgresql://user:strong_password@prod-db.example.com:5432/asked_db?schema=public"
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
TELEGRAM_BOT_TOKEN=9876543210:XYZabcDEFghiJKLmnoPQRstu
TELEGRAM_AUTH_MAX_AGE_SEC=3600
```

