import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AdminGuard } from '../auth/admin.guard';
import { CurrentTelegramUser } from '../auth/decorators/current-telegram-user.decorator';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import type { OrdersListResponse } from '../orders/dto/order.dto';
import { OrdersService } from '../orders/orders.service';
import { TelegramBotService } from '../orders/telegram-bot.service';
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
    private readonly telegramBotService: TelegramBotService,
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

  @Post('telegram/test')
  async testTelegramNotification(): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.telegramBotService.sendTestNotification();
  }

  @Get('telegram/debug-config')
  async getTelegramDebugConfig(): Promise<{
    configured: {
      botToken: boolean;
      adminTgId: boolean;
      adminChatId: boolean;
      adminChatThreadId: boolean;
      legacyAdminChatId: boolean;
    };
    instructions: string;
  }> {
    // Return configuration status (without exposing actual values for security)
    return {
      configured: {
        botToken: !!process.env.TELEGRAM_BOT_TOKEN,
        adminTgId: !!process.env.ADMIN_TG_ID,
        adminChatId: !!process.env.ADMIN_CHAT_ID,
        adminChatThreadId: !!process.env.ADMIN_CHAT_THREAD_ID,
        legacyAdminChatId: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
      },
      instructions:
        'To obtain chat_id and thread_id, send any message to the bot from the chat/topic, then check bot logs. Alternatively, use @userinfobot in Telegram to get your user ID, or @getidsbot to get group chat ID and topic ID.',
    };
  }

  @Get('debug/users-count')
  async getUsersCount(): Promise<{ count: number }> {
    try {
      const count = await this.prisma.user.count();
      return { count };
    } catch (error) {
      // Never 500 - return error info instead
      return { count: -1 };
    }
  }

  @Get('debug/users-latest')
  async getUsersLatest(): Promise<{
    users: Array<{
      telegramId: string;
      username: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    try {
      const users = await this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          telegramId: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        users: users.map((u) => ({
          telegramId: u.telegramId,
          username: u.username,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
      };
    } catch (error) {
      // Never 500 - return empty array instead
      return { users: [] };
    }
  }

  @Get('debug/db')
  async getDbInfo(): Promise<{
    host: string | null;
    database: string | null;
    hasConnection: boolean;
  }> {
    try {
      // Parse DATABASE_URL to extract host and database (mask password)
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return { host: null, database: null, hasConnection: false };
      }

      // Format: postgresql://user:password@host:port/database
      const url = new URL(dbUrl);
      const host = url.hostname;
      const database = url.pathname.replace('/', '');

      // Test connection by doing a simple query
      await this.prisma.user.count();

      return {
        host,
        database,
        hasConnection: true,
      };
    } catch (error) {
      return {
        host: null,
        database: null,
        hasConnection: false,
      };
    }
  }

  @Get('dashboard/summary')
  async getDashboardSummary(): Promise<{
    todayOrders: number;
    todayRevenue: number;
    totalOrders: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Orders today (created today, not deleted)
    const todayOrdersCount = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        deletedAt: null, // Exclude deleted orders
      },
    });

    // Revenue today (sum of totalAmount for orders created today, not deleted)
    const todayOrders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        deletedAt: null, // Exclude deleted orders
      },
      select: {
        totalAmount: true,
      },
    });

    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Total orders count (not deleted)
    const totalOrders = await this.prisma.order.count({
      where: {
        deletedAt: null, // Exclude deleted orders
      },
    });

    return {
      todayOrders: todayOrdersCount,
      todayRevenue,
      totalOrders,
    };
  }
}
