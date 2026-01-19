import { Module } from '@nestjs/common';

import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

import { AdminChatConfigBotController } from './admin-chat-config-bot.controller';
import { AdminChatConfigService } from './admin-chat-config.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PublicOrdersController } from './public-orders.controller';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AnalyticsModule,
    NotificationsModule,
    WarehouseModule,
  ],
  controllers: [OrdersController, PublicOrdersController, AdminChatConfigBotController],
  providers: [OrdersService, TelegramBotService, AdminChatConfigService],
  exports: [OrdersService, TelegramBotService, AdminChatConfigService],
})
export class OrdersModule {}
