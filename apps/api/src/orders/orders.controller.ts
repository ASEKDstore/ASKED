import { Controller, Get, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';

import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import type { AuthenticatedRequest } from '../auth/telegram-auth.guard';
import { UsersService } from '../users/users.service';

import { createOrderSchema } from './dto/create-order.dto';
import type { OrderDto } from './dto/order.dto';
import type { OrdersListResponse } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { TelegramBotService } from './telegram-bot.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  @Post()
  @UseGuards(TelegramAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & AuthenticatedRequest,
    @Body() body: any,
  ): Promise<OrderDto> {
    const createOrderDto = createOrderSchema.parse(body);

    // User is authenticated via TelegramAuthGuard
    // req.user and req.telegramUser are both available
    const telegramUser = req.user;
    
    if (!telegramUser) {
      throw new Error('User not authenticated');
    }

    // Upsert user in database
    const user = await this.usersService.upsertByTelegramData(telegramUser);
    const userId = user.id;

    // Prepare user data for notification
    const userData = {
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      telegramId: telegramUser.id.toString(),
    };

    // Create order in DB
    // The service will:
    // - Link order to userId (telegramId)
    // - Store snapshot of items (title, price, qty)
    // - Set status = NEW
    const order = await this.ordersService.create(userId, createOrderDto);

    // Send Telegram notification to admin (fire and forget - don't fail order creation if it fails)
    this.telegramBotService.notifyNewOrder(order, userData).catch((error) => {
      // Log but don't fail the request
      console.error('Failed to send order notification:', error);
    });

    // Log order creation success
    console.log(`Order ${order.id} created successfully for user ${telegramUser.id}`);

    // Return 201 with order id
    return order;
  }

  @Get('my')
  @UseGuards(TelegramAuthGuard)
  async getMyOrders(@Req() req: Request & { user: TelegramUser }): Promise<OrdersListResponse> {
    // User is authenticated via TelegramAuthGuard, so req.user exists
    const user = await this.usersService.upsertByTelegramData(req.user);
    
    return this.ordersService.findByUserId(user.id, {
      page: 1,
      pageSize: 50,
    });
  }
}
