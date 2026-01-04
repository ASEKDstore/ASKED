import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OrdersModule, AuthModule],
  controllers: [AdminOrdersController],
})
export class AdminModule {}

