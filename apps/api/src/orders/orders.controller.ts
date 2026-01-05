import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { CurrentTelegramUser } from '../auth/decorators/current-telegram-user.decorator';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { UsersService } from '../users/users.service';

import { createOrderSchema } from './dto/create-order.dto';
import type { OrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(TelegramAuthGuard)
  async create(
    @CurrentTelegramUser() telegramUser: TelegramUser,
    @Body() body: any,
  ): Promise<OrderDto> {
    const createOrderDto = createOrderSchema.parse(body);

    // Upsert user to get user.id
    const user = await this.usersService.upsertByTelegramData(telegramUser);

    return this.ordersService.create(user.id, createOrderDto);
  }
}
