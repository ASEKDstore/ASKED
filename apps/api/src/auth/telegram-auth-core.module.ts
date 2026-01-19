import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';

import { TelegramAuthGuard } from './telegram-auth.guard';
import { TelegramInitDataService } from './telegram-init-data.service';

/**
 * Core Telegram authentication module
 * Provides TelegramInitDataService and TelegramAuthGuard
 * This module is separate from AuthModule to avoid circular dependencies
 *
 * Imports ConfigModule for ConfigService (required by TelegramAuthGuard)
 * Imports PrismaModule for PrismaService (required by TelegramAuthGuard)
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [TelegramInitDataService, TelegramAuthGuard],
  exports: [TelegramInitDataService, TelegramAuthGuard],
})
export class TelegramAuthCoreModule {}
