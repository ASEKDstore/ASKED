import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { TelegramInitDataService } from '../auth/telegram-init-data.service';
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
    private readonly telegramInitDataService: TelegramInitDataService,
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

    if (telegramUser) {
      // User authenticated via Telegram
      const user = await this.usersService.upsertByTelegramData(telegramUser);
      userId = user.id;
    } else if (allowGuestCheckout) {
      // Guest checkout allowed - userId will be null
      userId = null;
    } else {
      // Guest checkout not allowed and no Telegram auth
      throw new UnauthorizedException(
        'Authentication required. Please open the app from Telegram.',
      );
    }

    return this.ordersService.create(userId, createOrderDto);
  }
}
