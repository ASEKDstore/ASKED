# Admin Chat Configuration via Bot Commands

## 1. Diagnosis

**Root Cause:** Manual ENV configuration for admin chat is cumbersome. Users need to manually set `ADMIN_CHAT_ID` and `ADMIN_CHAT_THREAD_ID` in environment variables.

**Solution:** Store admin chat configuration in database, configurable via bot commands. ENV variables remain as fallback for backward compatibility.

## 2. Concrete Plan

1. ✅ Add `AdminChatConfig` Prisma model (single row storage)
2. ✅ Create `AdminChatConfigService` for DB operations
3. ✅ Create bot API endpoints (secured by bot token)
4. ✅ Add bot commands: `/set_admin_chat`, `/get_admin_chat`, `/clear_admin_chat`
5. ✅ Update `TelegramBotService.sendToAdminChat()` to use DB config with ENV fallback
6. ✅ Ensure all notifications (orders, subscriptions) use unified `sendToAdminChat()`

## 3. File-by-File Changes

### `apps/api/prisma/schema.prisma`

```prisma
model AdminChatConfig {
  id        Int      @id @default(1)
  chatId    String   // Store as String to handle BigInt safely (Telegram chat IDs can be very large)
  threadId  Int?
  updatedAt DateTime @updatedAt

  @@map("admin_chat_config")
}
```

### `apps/api/prisma/migrations/20250113000000_add_admin_chat_config/migration.sql`

```sql
-- CreateTable
CREATE TABLE "admin_chat_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "chatId" TEXT NOT NULL,
    "threadId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_chat_config_pkey" PRIMARY KEY ("id")
);
```

### `apps/api/src/orders/admin-chat-config.service.ts` (NEW)

```typescript
@Injectable()
export class AdminChatConfigService {
  async getConfig(): Promise<AdminChatConfigDto | null>
  async setConfig(chatId: string, threadId: number | null): Promise<AdminChatConfigDto>
  async clearConfig(): Promise<void>
}
```

### `apps/api/src/orders/admin-chat-config-bot.controller.ts` (NEW)

```typescript
@Controller('telegram/admin-chat-config')
export class AdminChatConfigBotController {
  @Get()  // Get config
  @Post() // Set config
  @Delete() // Clear config
}
// All secured by x-bot-token header
```

### `apps/api/src/orders/orders.module.ts`

```typescript
@Module({
  controllers: [..., AdminChatConfigBotController],
  providers: [..., AdminChatConfigService],
  exports: [..., AdminChatConfigService],
})
```

### `apps/api/src/orders/telegram-bot.service.ts`

**Constructor:**
```typescript
constructor(
  private readonly configService: ConfigService,
  private readonly adminChatConfigService: AdminChatConfigService, // Added
) { ... }
```

**New method:**
```typescript
private async resolveAdminChatConfig(): Promise<{ chatId: string | null; threadId: number | null }> {
  // 1. Try DB config first
  // 2. Fallback to ENV (ADMIN_CHAT_ID, ADMIN_CHAT_THREAD_ID)
  // 3. Return null if neither configured
}
```

**Updated method:**
```typescript
async sendToAdminChat(text: string, options?: {...}): Promise<void> {
  const config = await this.resolveAdminChatConfig(); // Uses DB or ENV
  // Send message using resolved config
  // Log warnings on failure, don't throw
}
```

### `apps/bot/src/index.ts`

**New helper:**
```typescript
function isAdmin(userId: number | undefined): boolean {
  return adminTgId && userId?.toString() === adminTgId;
}
```

**New commands:**
```typescript
bot.command('set_admin_chat', async (ctx) => {
  // 1. Check admin access
  // 2. Validate chat type (not private)
  // 3. Extract chatId and threadId
  // 4. Call API to save
  // 5. Reply with confirmation
})

bot.command('get_admin_chat', async (ctx) => {
  // 1. Check admin access
  // 2. Call API to get config
  // 3. Display current config or "не задано"
})

bot.command('clear_admin_chat', async (ctx) => {
  // 1. Check admin access
  // 2. Call API to clear
  // 3. Reply with confirmation
})
```

## 4. Migration Steps

### Apply Migration

```bash
cd apps/api
pnpm prisma migrate deploy
# or for dev:
pnpm prisma migrate dev
```

**Migration SQL is already created:** `apps/api/prisma/migrations/20250113000000_add_admin_chat_config/migration.sql`

### Generate Prisma Client

```bash
cd apps/api
pnpm prisma generate
```

## 5. Verification Steps

### Step 1: Apply Migration

```bash
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate
```

### Step 2: Start Services

```bash
# Terminal 1: API
cd apps/api
pnpm start:dev

# Terminal 2: Bot
cd apps/bot
pnpm dev
```

### Step 3: Configure Admin Chat via Bot

1. **Add bot to admin group:**
   - Create a Telegram group/supergroup
   - Add bot as administrator
   - If using forum topics, add bot to the specific topic

2. **Set admin chat:**
   - In the group, send: `/set_admin_chat`
   - Bot should reply: "✅ Админ-чат сохранён. chat_id=..., thread_id=..."
   - If in a forum topic, thread_id will be included

3. **Verify config:**
   - Send: `/get_admin_chat`
   - Bot should display current config

### Step 4: Test Order Notifications

1. **Create a test order** (via frontend or API)
2. **Check notifications:**
   - ✅ Admin DM should receive notification (if ADMIN_TG_ID set)
   - ✅ Admin chat (from DB config) should receive notification
   - ✅ If in forum topic, message should appear in that topic

### Step 5: Test Subscription Reminders

1. **Create test subscription:**
   - Name: "Test Subscription"
   - lastPaidAt: today - 29 days (so reminder triggers tomorrow)
   - periodMonths: 1
   - remindBeforeDays: 1

2. **Trigger reminder manually** (or wait for cron):
   ```bash
   # Or modify dates in DB to trigger immediately
   ```

3. **Check notifications:**
   - ✅ Admin DM should receive reminder with button
   - ✅ Admin chat should receive reminder with button
   - ✅ Button should work to update payment date

### Step 6: Test Subscription Update Confirmation

1. **Click "🔄 Обновить дату оплаты" button** in reminder message
2. **Check confirmations:**
   - ✅ Admin DM should receive confirmation
   - ✅ Admin chat should receive confirmation
   - ✅ Subscription payment date should be updated in DB

### Step 7: Test Clear Config

1. **Clear config:**
   - Send: `/clear_admin_chat`
   - Bot should reply: "🗑 Админ-чат сброшен."

2. **Verify fallback:**
   - Create another test order
   - Should use ENV variables (if set) or skip admin chat notification
   - Check logs for: "⚠️ Admin chat not configured (neither DB nor ENV)"

### Step 8: Test Security

1. **Non-admin user:**
   - Non-admin tries `/set_admin_chat`
   - Should receive: "❌ Нет доступа. Эта команда доступна только администратору."

2. **Private chat:**
   - Admin tries `/set_admin_chat` in DM
   - Should receive: "❌ Админ-чат должен быть группой или супергруппой."

### Step 9: Test Forum Topics

1. **In a forum group:**
   - Navigate to a specific topic
   - Send `/set_admin_chat`
   - Verify thread_id is saved
   - Create test order
   - Verify message appears in that topic

### Step 10: Test Error Resilience

1. **Remove bot from group** (or revoke admin rights)
2. **Trigger notification:**
   - Create test order
   - Check logs: Should log warning but not crash
   - Check logs for: "⚠️ Failed to send message to admin chat: ..."

## 6. Logs to Check

**Success indicators:**
```
✅ Admin chat config updated: chatId=..., threadId=...
📋 Using admin chat config from DB: chatId=..., threadId=...
✅ Message sent to admin chat (...) in thread ...
```

**Fallback indicators:**
```
📋 Using admin chat config from ENV: chatId=..., threadId=...
⚠️ Admin chat not configured (neither DB nor ENV) - skipping admin chat message
```

**Error indicators (should not crash):**
```
⚠️ Failed to send message to admin chat (...): Forbidden (bot not in chat)
⚠️ Failed to send message to admin chat (...): Bad Request: chat not found
```

## 7. Priority Order

**Configuration resolution priority:**
1. **DB config** (if `/set_admin_chat` was used)
2. **ENV variables** (`ADMIN_CHAT_ID`, `ADMIN_CHAT_THREAD_ID`)
3. **No-op** (log warning, skip admin chat notification)

**Backward compatibility:**
- ✅ Existing ENV-based setup continues to work
- ✅ DB config takes priority when present
- ✅ Clearing DB config falls back to ENV

## 8. Security

- ✅ Only `ADMIN_TG_ID` can execute commands
- ✅ Bot token required for API endpoints
- ✅ Commands validate chat type (group/supergroup only)
- ✅ Error messages don't expose sensitive info

## 9. Database Schema

**Table: `admin_chat_config`**
- Single row (id = 1)
- `chatId`: String (handles BigInt Telegram IDs safely)
- `threadId`: Int? (nullable, for forum topics)
- `updatedAt`: DateTime (auto-updated)

**Migration:** `20250113000000_add_admin_chat_config`

