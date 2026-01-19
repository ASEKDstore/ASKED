import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { AuthenticatedRequest } from '../auth/telegram-auth.guard';
import { UsersService } from '../users/users.service';

import type { OrdersListResponse } from './dto/order.dto';
import { OrdersService } from './orders.service';

@Controller('public/orders')
export class PublicOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  @Get('my')
  @UseGuards(TelegramAuthGuard)
  async getMyOrders(@Req() req: Request & AuthenticatedRequest): Promise<OrdersListResponse> {
    // User is authenticated via TelegramAuthGuard
    // Return orders WHERE buyerTelegramId matches authenticated user
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await this.usersService.upsertByTelegramData(req.user);

    // Return orders for this user (filtered by userId)
    return this.ordersService.findByUserId(user.id, {
      page: 1,
      pageSize: 50,
    });
  }
}
