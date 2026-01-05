import dotenv from 'dotenv';
import { Bot, Context, InlineKeyboard } from 'grammy';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webappUrl = process.env.WEBAPP_URL || 'https://asked-web.onrender.com';

// Protect against empty token
if (!token || token.trim() === '') {
  console.error('ERROR: TELEGRAM_BOT_TOKEN is missing or empty');
  console.error('Bot cannot start without a valid token');
  process.exit(1);
}

const bot = new Bot(token);

// Handle /start command
bot.command('start', async (ctx: Context) => {
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

// Handle /help command
bot.command('help', async (ctx: Context) => {
  await ctx.reply(
    'Доступные команды:\n' +
    '/start - Открыть магазин\n' +
    '/admin - Открыть админ-панель\n' +
    '/help - Показать помощь'
  );
});

// Handle all other messages
bot.on('message', async (ctx: Context) => {
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

