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
  console.log('[START] Sending LAB image and button');
  
  // LAB image URL (production URL)
  const labImageUrl = `${webappUrl}/lab/mascot.png`;
  
  // Create inline keyboard with web_app button for LAB mode
  const keyboard = new InlineKeyboard().webApp('🚀 Открыть LAB', `${webappUrl}/lab`);
  
  // Send photo with caption and button
  await ctx.replyWithPhoto(labImageUrl, {
    caption: 'Твой кастом почти у тебя в руках!\nПереходи LAB по кнопке ниже.',
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

// Helper: Check if user is admin
function isAdmin(userId: number | undefined): boolean {
  if (!adminTgId || !userId) {
    return false;
  }
  return userId.toString() === adminTgId;
}

// Handle /set_admin_chat command (admin-only)
bot.command('set_admin_chat', async (ctx: Context) => {
  const userId = ctx.from?.id;

  // Check if user is admin
  if (!isAdmin(userId)) {
    await ctx.reply('❌ Нет доступа. Эта команда доступна только администратору.');
    return;
  }

  // Must be run in a chat (group/supergroup), not in DM
  const chatId = ctx.chat?.id;
  const messageThreadId = ctx.message?.message_thread_id;

  if (!chatId) {
    await ctx.reply('❌ Не удалось определить chat_id. Убедитесь, что команда выполнена в группе/чате.');
    return;
  }

  // Private chat (DM) check - admin chat should be a group/supergroup
  if (ctx.chat?.type === 'private') {
    await ctx.reply('❌ Админ-чат должен быть группой или супергруппой. Выполните команду в нужной группе.');
    return;
  }

  try {
    // Call API to save config
    const response = (await callApi(
      '/telegram/admin-chat-config',
      'POST',
      {
        chatId: chatId.toString(),
        threadId: messageThreadId ?? null,
      },
      {
        'x-bot-token': token,
      },
    )) as {
      success: boolean;
      config?: { chatId: string; threadId: number | null; updatedAt: string };
      error?: string;
    };

    if (!response.success) {
      throw new Error(response.error || 'Failed to save admin chat config');
    }

    let responseText = `✅ *Админ-чат сохранён*\n\n`;
    responseText += `*Chat ID:* \`${response.config?.chatId}\`\n`;
    if (response.config?.threadId) {
      responseText += `*Thread ID:* \`${response.config.threadId}\`\n`;
    } else {
      responseText += `*Thread ID:* не указан\n`;
    }

    await ctx.reply(responseText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error setting admin chat config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    await ctx.reply(`❌ Ошибка: ${errorMessage}`);
  }
});

// Handle /get_admin_chat command (admin-only)
bot.command('get_admin_chat', async (ctx: Context) => {
  const userId = ctx.from?.id;

  // Check if user is admin
  if (!isAdmin(userId)) {
    await ctx.reply('❌ Нет доступа. Эта команда доступна только администратору.');
    return;
  }

  try {
    // Call API to get config
    const response = (await callApi(
      '/telegram/admin-chat-config',
      'GET',
      undefined,
      {
        'x-bot-token': token,
      },
    )) as {
      success: boolean;
      config?: { chatId: string; threadId: number | null; updatedAt: string } | null;
      error?: string;
    };

    if (!response.success) {
      throw new Error(response.error || 'Failed to get admin chat config');
    }

    if (!response.config) {
      await ctx.reply('ℹ️ Админ-чат не задан.\nИспользуйте /set_admin_chat в нужной группе, чтобы установить.');
      return;
    }

    let responseText = `📋 *Текущая конфигурация админ-чата*\n\n`;
    responseText += `*Chat ID:* \`${response.config.chatId}\`\n`;
    if (response.config.threadId) {
      responseText += `*Thread ID:* \`${response.config.threadId}\`\n`;
    } else {
      responseText += `*Thread ID:* не указан\n`;
    }
    responseText += `*Обновлено:* ${new Date(response.config.updatedAt).toLocaleString('ru-RU')}\n`;

    await ctx.reply(responseText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error getting admin chat config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    await ctx.reply(`❌ Ошибка: ${errorMessage}`);
  }
});

// Handle /clear_admin_chat command (admin-only)
bot.command('clear_admin_chat', async (ctx: Context) => {
  const userId = ctx.from?.id;

  // Check if user is admin
  if (!isAdmin(userId)) {
    await ctx.reply('❌ Нет доступа. Эта команда доступна только администратору.');
    return;
  }

  try {
    // Call API to clear config
    const response = (await callApi(
      '/telegram/admin-chat-config',
      'DELETE',
      undefined,
      {
        'x-bot-token': token,
      },
    )) as {
      success: boolean;
      error?: string;
    };

    if (!response.success) {
      throw new Error(response.error || 'Failed to clear admin chat config');
    }

    await ctx.reply('🗑 *Админ-чат сброшен.*\nТеперь будут использоваться значения из ENV (если заданы) или уведомления в админ-чат отправляться не будут.', {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Error clearing admin chat config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    await ctx.reply(`❌ Ошибка: ${errorMessage}`);
  }
});

// Handle /debug_chat command (admin-only)
bot.command('debug_chat', async (ctx: Context) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const messageThreadId = ctx.message?.message_thread_id;

  // Check if user is admin
  if (!isAdmin(userId)) {
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

  responseText += `\n💡 Используйте /set_admin_chat для сохранения этого чата как админ-чат.\n`;
  responseText += `Или используйте эти значения для настройки ENV:\n`;
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
    helpText += '/set_admin_chat - Сохранить текущий чат как админ-чат\n';
    helpText += '/get_admin_chat - Показать текущую конфигурацию админ-чата\n';
    helpText += '/clear_admin_chat - Сбросить конфигурацию админ-чата\n';
    helpText += '/debug_chat - Показать chat_id и thread_id (для настройки)\n';
  }

  helpText += '/help - Показать помощь';

  await ctx.reply(helpText);
});

// Handle callback_query for subscription payment update
bot.callbackQuery(/^update_subscription_payment:(.+)$/, async (ctx: Context) => {
  // Type guard: ensure callbackQuery exists and has data
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    return;
  }

  const userId = ctx.from?.id;
  const callbackQuery = ctx.callbackQuery;
  const callbackData = callbackQuery.data;

  // Validate admin access
  if (!adminTgId || userId?.toString() !== adminTgId) {
    await ctx.answerCallbackQuery({
      text: '❌ Доступ запрещен. Только администратор может обновлять подписки.',
      show_alert: true,
    });
    return;
  }

  if (!callbackData || typeof callbackData !== 'string') {
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
      if (callbackQuery.message && 'text' in callbackQuery.message) {
        const messageText = callbackQuery.message.text;
        if (typeof messageText === 'string') {
          await ctx.editMessageText(
            `${messageText}\n\n✅ Обновлено: ${new Date().toLocaleString('ru-RU')}`,
          );
        }
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

// Handle all other callback queries (catch-all)
bot.on('callback_query:data', async (ctx: Context) => {
  // Only handle if callbackQuery exists and has data
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    return;
  }

  // Skip if already handled by the pattern handler above
  const callbackData = ctx.callbackQuery.data;
  if (typeof callbackData === 'string' && callbackData.startsWith('update_subscription_payment:')) {
    return;
  }

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

