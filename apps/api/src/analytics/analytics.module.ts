import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AppEventsService } from './app-events.service';
import { AppOpensService } from './app-opens.service';
import { EventsController } from './events.controller';
import { TelegramSnapshotService } from './telegram-snapshot.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramWebhookService } from './telegram-webhook.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [AdminAnalyticsController, EventsController, TelegramWebhookController],
  providers: [
    AnalyticsService,
    AppEventsService,
    AppOpensService,
    TelegramWebhookService,
    TelegramSnapshotService,
    DevAdminAuthGuard,
    AdminGuard,
  ],
  exports: [AnalyticsService, AppEventsService, AppOpensService],
})
export class AnalyticsModule {}
