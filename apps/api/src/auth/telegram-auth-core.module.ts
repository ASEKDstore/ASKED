import { Module } from '@nestjs/common';

import { TelegramAuthGuard } from './telegram-auth.guard';
import { TelegramInitDataService } from './telegram-init-data.service';

/**
 * Core Telegram authentication module
 * Provides TelegramInitDataService and TelegramAuthGuard
 * This module is separate from AuthModule to avoid circular dependencies
 */
@Module({
  providers: [TelegramInitDataService, TelegramAuthGuard],
  exports: [TelegramInitDataService, TelegramAuthGuard],
})
export class TelegramAuthCoreModule {}

