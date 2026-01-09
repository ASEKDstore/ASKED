import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

import { OrdersController } from './orders.controller';
import { PublicOrdersController } from './public-orders.controller';
import { OrdersService } from './orders.service';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService, TelegramBotService],
  exports: [OrdersService],
})
export class OrdersModule {}



