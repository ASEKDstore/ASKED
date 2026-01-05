import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AdminGuard } from '../auth/admin.guard';
import { CurrentTelegramUser } from '../auth/decorators/current-telegram-user.decorator';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import type { OrdersListResponse } from '../orders/dto/order.dto';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ProductsListResponse } from '../products/dto/product.dto';
import { ProductsService } from '../products/products.service';

interface AdminMeResponse {
  user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  role: 'OWNER' | 'MANAGER';
}

@Controller('admin')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
// DevAdminAuthGuard runs first, if it allows access, TelegramAuthGuard and AdminGuard are skipped
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  @Get('me')
  async getMe(
    @Req() req: Request & { isDevAdmin?: boolean },
    @CurrentTelegramUser() telegramUser?: TelegramUser,
  ): Promise<AdminMeResponse> {
    // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
    // Handle dev admin mode
    if (req.isDevAdmin === true) {
      return {
        user: {
          id: 'dev-admin',
          telegramId: '930749603',
          username: 'dev_admin',
          firstName: 'Dev',
          lastName: 'Admin',
        },
        role: 'OWNER',
      };
    }

    if (!telegramUser) {
      throw new Error('User not authenticated');
    }

    const user = await this.prisma.user.findUnique({
      where: { telegramId: telegramUser.id.toString() },
      include: {
        admin: true,
      },
    });

    if (!user || !user.admin) {
      throw new Error('Admin user not found'); // Should not happen due to AdminGuard
    }

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      role: user.admin.role as 'OWNER' | 'MANAGER',
    };
  }

  @Get('orders')
  async getOrders(): Promise<OrdersListResponse> {
    return this.ordersService.findAll({
      page: 1,
      pageSize: 50,
    });
  }

  @Get('products')
  async getProducts(): Promise<ProductsListResponse> {
    return this.productsService.findAll({
      page: 1,
      pageSize: 50,
      sort: 'new',
    });
  }
}
