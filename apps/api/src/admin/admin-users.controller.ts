import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/users')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<{
    items: Array<{
      telegramId: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      firstOpenedAt: string | null;
      lastOpenedAt: string | null;
      opensCount: number | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const pageSizeNum = pageSize ? Math.min(100, Math.max(1, parseInt(pageSize, 10))) : 20;
    const skip = (pageNum - 1) * pageSizeNum;

    // Build search condition
    const searchCondition = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { telegramId: { contains: search } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    // Get users with app open events (left join)
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: searchCondition,
        take: pageSizeNum,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      }),
      this.prisma.user.count({
        where: searchCondition,
      }),
    ]);

    // Get app open events for these users
    const telegramIds = users.map((u) => u.telegramId);
    const appOpenEvents = await this.prisma.appOpenEvent.findMany({
      where: {
        userId: { in: telegramIds },
      },
      select: {
        userId: true,
        firstOpenedAt: true,
        lastOpenedAt: true,
        opensCount: true,
      },
    });

    // Create a map for quick lookup
    const appOpenMap = new Map(
      appOpenEvents.map((event) => [event.userId, event]),
    );

    // Combine user data with app open events
    const items = users.map((user) => {
      const appOpen = appOpenMap.get(user.telegramId);
      return {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        firstOpenedAt: appOpen?.firstOpenedAt.toISOString() || null,
        lastOpenedAt: appOpen?.lastOpenedAt.toISOString() || null,
        opensCount: appOpen?.opensCount || null,
      };
    });

    return {
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };
  }
}

