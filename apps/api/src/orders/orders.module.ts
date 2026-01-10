import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

import { AdminChatConfigBotController } from './admin-chat-config-bot.controller';
import { AdminChatConfigService } from './admin-chat-config.service';
import { OrdersController } from './orders.controller';
import { PublicOrdersController } from './public-orders.controller';
import { OrdersService } from './orders.service';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [OrdersController, PublicOrdersController, AdminChatConfigBotController],
  providers: [OrdersService, TelegramBotService, AdminChatConfigService],
  exports: [OrdersService, TelegramBotService, AdminChatConfigService],
})
export class OrdersModule {}



