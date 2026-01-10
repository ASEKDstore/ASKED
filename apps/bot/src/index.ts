import dotenv from 'dotenv';
import { Bot, Context, InlineKeyboard } from 'grammy';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webappUrl = process.env.WEBAPP_URL;
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const adminTgId = process.env.ADMIN_TG_ID;

// Protect against empty token
if (!token || token.trim() === '') {
  console.error('ERROR: TELEGRAM_BOT_TOKEN is missing or empty');
  console.error('Bot cannot start without a valid token');
  process.exit(1);
}

// Protect against empty WEBAPP_URL
if (!webappUrl || webappUrl.trim() === '') {
  console.error('ERROR: WEBAPP_URL is missing or empty');
  console.error('Bot cannot start without a valid WEBAPP_URL');
  process.exit(1);
}

// Helper to call API
async function callApi(
  endpoint: string,
  method: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const url = `${apiUrl}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

const bot = new Bot(token);

// Handle /start command
bot.command('start', async (ctx: Context) => {
  const userId = ctx.from?.id;
  
  // Logging for diagnostics
  console.log('[START] User ID:', userId);
  console.log('[START] WEBAPP_URL:', webappUrl);
  console.log('[START] Sending web_app button');
  
  // Create inline keyboard with web_app button (NOT url button)
  const keyboard = new InlineKeyboard().webApp('Открыть магазин', webappUrl);
  
  await ctx.reply('👋 Привет! Я бот ASKED Miniapp.\n\nНажмите кнопку ниже, чтобы открыть магазин:', {
    reply_markup: keyboard,
  });
});

// Handle /admin command
bot.command('admin', async (ctx: Context) => {
  const keyboard = new InlineKeyboard().webApp('Админка', `${webappUrl}/admin`);
  
  await ctx.reply('Открыть админ-панель:', {
    reply_markup: keyboard,
  });
});

// Handle /open command
bot.command('open', async (ctx: Context) => {
  const keyboard = new InlineKeyboard().webApp('Открыть админку', `${webappUrl}/admin`);
  
  await ctx.reply('Открыть админ-панель:', {
    reply_markup: keyboard,
  });
});

// Handle /whoami command
bot.command('whoami', async (ctx: Context) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || 'не указан';
  
  await ctx.reply(`Your Telegram ID: ${userId}, username: ${username}`);
});

// Handle /debug_chat command (admin-only)
bot.command('debug_chat', async (ctx: Context) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const messageThreadId = ctx.message?.message_thread_id;

  // Check if user is admin
  if (adminTgId && userId?.toString() !== adminTgId) {
    await ctx.reply('❌ Доступ запрещен. Эта команда доступна только администратору.');
    return;
  }

  let responseText = `🔍 *Debug информация*\n\n`;
  responseText += `*Chat ID:* \`${chatId}\`\n`;
  responseText += `*User ID:* \`${userId}\`\n`;
  if (messageThreadId) {
    responseText += `*Message Thread ID:* \`${messageThreadId}\`\n`;
  } else {
    responseText += `*Message Thread ID:* не указан (это не топик форума)\n`;
  }

  responseText += `\n💡 Используйте эти значения для настройки:\n`;
  responseText += `- ADMIN_CHAT_ID=${chatId}\n`;
  if (messageThreadId) {
    responseText += `- ADMIN_CHAT_THREAD_ID=${messageThreadId}\n`;
  }

  await ctx.reply(responseText, { parse_mode: 'Markdown' });
});

// Handle /help command
bot.command('help', async (ctx: Context) => {
  const userId = ctx.from?.id;
  const isAdmin = adminTgId && userId?.toString() === adminTgId;

  let helpText =
    'Доступные команды:\n' +
    '/start - Открыть магазин\n' +
    '/admin - Открыть админ-панель\n' +
    '/open - Открыть админ-панель\n' +
    '/whoami - Показать ваш Telegram ID и username\n';

  if (isAdmin) {
    helpText += '/debug_chat - Показать chat_id и thread_id (для настройки ADMIN_CHAT_ID)\n';
  }

  helpText += '/help - Показать помощь';

  await ctx.reply(helpText);
});

// Handle callback_query for subscription payment update
bot.callbackQuery(/^update_subscription_payment:(.+)$/, async (ctx: Context) => {
  const userId = ctx.from?.id;
  const callbackData = ctx.callbackQuery.data;

  // Validate admin access
  if (!adminTgId || userId?.toString() !== adminTgId) {
    await ctx.answerCallbackQuery({
      text: '❌ Доступ запрещен. Только администратор может обновлять подписки.',
      show_alert: true,
    });
    return;
  }

  if (!callbackData) {
    await ctx.answerCallbackQuery({
      text: '❌ Ошибка: неверные данные',
      show_alert: true,
    });
    return;
  }

  // Extract subscription ID from callback_data
  const match = callbackData.match(/^update_subscription_payment:(.+)$/);
  if (!match || !match[1]) {
    await ctx.answerCallbackQuery({
      text: '❌ Ошибка: неверный формат данных',
      show_alert: true,
    });
    return;
  }

  const subscriptionId = match[1];

  try {
    // Show loading state
    await ctx.answerCallbackQuery({
      text: '⏳ Обновление...',
    });

    // Call API to update subscription payment date (using bot token auth)
    const response = (await callApi(
      `/telegram/subscriptions/${subscriptionId}/update-payment-date`,
      'POST',
      undefined,
      {
        'x-bot-token': token,
      },
    )) as {
      success: boolean;
      subscription?: { id: string; name: string; nextDueAt: string };
      error?: string;
    };

    if (!response.success || !response.subscription) {
      throw new Error(response.error || 'Failed to update subscription');
    }

    const updatedSubscription = response.subscription;

    // Format new due date
    const newDueDate = new Date(updatedSubscription.nextDueAt);
    const newDueDateFormatted = newDueDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Send confirmation message (API already sends to admin DM and chat)
    const confirmationText = `✅ Подписка «${updatedSubscription.name}» обновлена.\nНовая дата окончания: ${newDueDateFormatted}`;

    await ctx.reply(confirmationText);

    // Also try to edit the original message to show it was updated
    try {
      if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
        await ctx.editMessageText(
          `${ctx.callbackQuery.message.text}\n\n✅ Обновлено: ${new Date().toLocaleString('ru-RU')}`,
        );
      }
    } catch (editError) {
      // Ignore edit errors (message might be too old or already edited)
      console.log('Could not edit message:', editError);
    }

    console.log(
      `✅ Subscription ${subscriptionId} payment date updated by admin ${userId}`,
    );
  } catch (error) {
    console.error('Error updating subscription payment date:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Неизвестная ошибка';

    await ctx.answerCallbackQuery({
      text: `❌ Ошибка: ${errorMessage}`,
      show_alert: true,
    });
  }
});

// Handle all other callback queries
bot.callbackQuery(async (ctx: Context) => {
  await ctx.answerCallbackQuery({
    text: 'Неизвестная команда',
  });
});

// Handle all other messages
bot.on('message', async (ctx: Context) => {
  // Log chat_id and thread_id for debugging (admin only)
  if (adminTgId && ctx.from?.id?.toString() === adminTgId) {
    const chatId = ctx.chat?.id;
    const messageThreadId = ctx.message?.message_thread_id;
    console.log(
      `[DEBUG] Admin message - Chat ID: ${chatId}, Thread ID: ${messageThreadId || 'none'}`,
    );
  }

  await ctx.reply('Получено сообщение! Используйте /help для списка команд.');
});

// Error handling
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof Error) {
    console.error('Error message:', e.message);
  }
});

// Start bot
bot.start().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

console.log('🤖 Bot is running...');

