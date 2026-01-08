import { Controller, Get, Post, Body, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { TelegramInitDataService } from '../auth/telegram-init-data.service';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
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
    private readonly telegramInitDataService: TelegramInitDataService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() body: any): Promise<OrderDto> {
    const createOrderDto = createOrderSchema.parse(body);
    const allowGuestCheckout = process.env.ALLOW_GUEST_CHECKOUT === 'true';

    // Try to parse Telegram initData if present
    const initDataHeader = req.headers['x-telegram-init-data'];
    let telegramUser: TelegramUser | undefined;

    if (initDataHeader) {
      try {
        const initData = typeof initDataHeader === 'string' ? initDataHeader : initDataHeader[0];
        if (initData) {
          telegramUser = this.telegramInitDataService.validateAndParse(initData);
        }
      } catch {
        // Invalid initData - ignore and proceed to guest checkout if allowed
      }
    }

    let userId: string | null = null;
    let userData: { username?: string; firstName?: string; lastName?: string; telegramId?: string } | undefined;

    if (telegramUser) {
      // User authenticated via Telegram
      const user = await this.usersService.upsertByTelegramData(telegramUser);
      userId = user.id;
      userData = {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        telegramId: telegramUser.id.toString(),
      };
    } else if (allowGuestCheckout) {
      // Guest checkout allowed - userId will be null
      userId = null;
    } else {
      // Guest checkout not allowed and no Telegram auth
      throw new UnauthorizedException(
        'Authentication required. Please open the app from Telegram.',
      );
    }

    const order = await this.ordersService.create(userId, createOrderDto);

    // Send Telegram notification (don't await - fire and forget)
    this.telegramBotService.notifyNewOrder(order, userData).catch((error) => {
      // Log but don't fail the request
      console.error('Failed to send order notification:', error);
    });

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
