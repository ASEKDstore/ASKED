import { Controller, Get, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentTelegramUser } from '../auth/decorators/current-telegram-user.decorator';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import type { OrdersListResponse } from '../orders/dto/order.dto';
import type { ProductsListResponse } from '../products/dto/product.dto';

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
@UseGuards(TelegramAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService
  ) {}

  @Get('me')
  async getMe(
    @CurrentTelegramUser() telegramUser: TelegramUser
  ): Promise<AdminMeResponse> {
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

