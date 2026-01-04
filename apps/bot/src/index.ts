import { Bot, Context } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN || '');

// Handle /start command
bot.command('start', async (ctx: Context) => {
  await ctx.reply('👋 Привет! Я бот ASKED Miniapp.');
});

// Handle /help command
bot.command('help', async (ctx: Context) => {
  await ctx.reply('Доступные команды:\n/start - Начать работу\n/help - Показать помощь');
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

