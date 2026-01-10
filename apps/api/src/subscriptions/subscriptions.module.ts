import { Module } from '@nestjs/common';

import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';

import { SubscriptionsBotController } from './subscriptions-bot.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsScheduler } from './subscriptions.scheduler';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [SubscriptionsController, SubscriptionsBotController],
  providers: [SubscriptionsService, SubscriptionsScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

