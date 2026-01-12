import { forwardRef, Module } from '@nestjs/common';

import { TelegramAuthGuard } from './telegram-auth.guard';
import { TelegramInitDataService } from './telegram-init-data.service';
import { UsersModule } from '../users/users.module';

/**
 * Core Telegram authentication module
 * Provides TelegramInitDataService and TelegramAuthGuard
 * This module is separate from AuthModule to avoid circular dependencies
 * Uses forwardRef to import UsersModule for user upsert in guard
 */
@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [TelegramInitDataService, TelegramAuthGuard],
  exports: [TelegramInitDataService, TelegramAuthGuard],
})
export class TelegramAuthCoreModule {}

