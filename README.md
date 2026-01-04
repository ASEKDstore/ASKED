# ASKED Miniapp Monorepo

Монорепозиторий для ASKED Miniapp приложения, построенный на pnpm workspaces.

## Структура проекта

```
asked-miniapp/
├── apps/
│   ├── web/          # Next.js frontend (React + TypeScript + Tailwind + shadcn/ui)
│   ├── api/          # NestJS backend (TypeScript + Prisma + Zod)
│   └── bot/          # Telegram bot (Node.js + TypeScript + grammY)
├── packages/
│   └── shared/       # Общие типы и zod схемы
└── package.json      # Root package.json с workspace скриптами
```

## Требования

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (для API)

## Установка

1. Клонируйте репозиторий
2. Установите зависимости:

```bash
pnpm install
```

## Настройка окружения

### apps/api/.env

**Для локальной разработки:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/asked_db?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_AUTH_MAX_AGE_SEC=86400
```

**Для production на Render:**
```env
DATABASE_URL="postgresql://asked_postgre_user:95V87ZoCCeT7ocNVq4XNWsywyjtAz3Bx@dpg-d5dcnvali9vc73dg0do0-a/asked_postgre"
PORT=3001
FRONTEND_URL=https://asked-web.onrender.com
TELEGRAM_BOT_TOKEN=8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M
TELEGRAM_AUTH_MAX_AGE_SEC=86400
```

### apps/web/.env.local

**Для локальной разработки:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Для production на Render:**
```env
NEXT_PUBLIC_API_URL=https://asked-api.onrender.com
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> 📝 **Примечание:** Подробная инструкция по настройке production окружения находится в [PRODUCTION_ENV.md](./PRODUCTION_ENV.md)

### apps/bot/.env

Создайте файл `apps/bot/.env`:

```env
BOT_TOKEN=your_telegram_bot_token_here
```

## Запуск

### Разработка

Запуск всех приложений (web + api) параллельно:

```bash
pnpm dev
```

Или запуск отдельных приложений:

```bash
# Web
pnpm --filter web dev

# API
pnpm --filter api start:dev

# Bot
pnpm --filter bot dev
```

### База данных (Prisma)

Перед первым запуском API необходимо:

1. Создать базу данных PostgreSQL
2. Применить миграции:

```bash
cd apps/api
pnpm prisma:migrate
pnpm prisma:generate
```

Или из корня:

```bash
pnpm --filter api prisma:migrate
pnpm --filter api prisma:generate
```

### Сборка

Сборка всех приложений:

```bash
pnpm build
```

Сборка конкретного приложения:

```bash
pnpm --filter web build
pnpm --filter api build
pnpm --filter bot build
```

## Скрипты

### Корневые скрипты

- `pnpm dev` - Запуск web и api в режиме разработки параллельно
- `pnpm build` - Сборка всех приложений
- `pnpm lint` - Линтинг всех пакетов
- `pnpm format` - Форматирование кода через Prettier
- `pnpm format:check` - Проверка форматирования
- `pnpm typecheck` - Проверка типов во всех пакетах
- `pnpm clean` - Очистка всех build артефактов и node_modules

### Скрипты приложений

Каждое приложение имеет свои собственные скрипты (см. соответствующие package.json файлы).

## Технологии

### apps/web
- **Framework**: Next.js 14
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Linting**: ESLint + Prettier

### apps/api
- **Framework**: NestJS
- **Language**: TypeScript (strict mode)
- **Database**: Prisma ORM + PostgreSQL
- **Validation**: Zod + class-validator
- **Linting**: ESLint + Prettier

### apps/bot
- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **Framework**: grammY
- **Linting**: ESLint + Prettier

### packages/shared
- **Language**: TypeScript (strict mode)
- **Validation**: Zod
- Общие типы и схемы валидации для всех приложений

## Разработка

### Добавление зависимостей

```bash
# В конкретный пакет/приложение
pnpm --filter web add package-name
pnpm --filter api add package-name

# В корневой package.json (dev зависимости)
pnpm add -D -w package-name
```

### Использование shared пакета

Пакет `@asked-miniapp/shared` автоматически доступен во всех приложениях:

```typescript
import { User, userSchema } from '@asked-miniapp/shared';
```

### TypeScript

Все проекты используют strict режим TypeScript. Конфигурация наследуется от корневого `tsconfig.json`.

### Линтинг и форматирование

Проект использует единые правила ESLint и Prettier для всего монорепозитория.

```bash
# Линтинг
pnpm lint

# Форматирование
pnpm format
```

## Структура команд

- Все команды выполняются через pnpm workspaces
- Используется `concurrently` для параллельного запуска web и api
- Каждое приложение имеет свою конфигурацию, но наследует общие правила из корня

## Дополнительная информация

- Документация Next.js: https://nextjs.org/docs
- Документация NestJS: https://docs.nestjs.com
- Документация grammY: https://grammy.dev
- Документация Prisma: https://www.prisma.io/docs
- Документация pnpm workspaces: https://pnpm.io/workspaces

