import { Controller, Get, Query, UseGuards, Logger, Header } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/users')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('count')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getUserCount(): Promise<{ count: number }> {
    try {
      const count = await this.prisma.user.count();
      return { count };
    } catch (error) {
      this.logger.error(
        'Failed to get user count',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
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
    try {
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

      // Get app open events for these users (if any users found)
      const telegramIds = users.map((u) => u.telegramId);
      const appOpenEvents =
        telegramIds.length > 0
          ? await this.prisma.appOpenEvent.findMany({
              where: {
                userId: { in: telegramIds },
              },
              select: {
                userId: true,
                firstOpenedAt: true,
                lastOpenedAt: true,
                opensCount: true,
              },
            })
          : [];

      // Create a map for quick lookup
      const appOpenMap = new Map(appOpenEvents.map((event) => [event.userId, event]));

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

      this.logger.log(
        `Admin users list: found ${total} total users, returning ${items.length} items`,
      );

      return {
        items,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      };
    } catch (error) {
      this.logger.error(
        'Failed to get admin users list',
        error instanceof Error ? error.stack : String(error),
      );
      // Return empty list instead of throwing to prevent 500
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      };
    }
  }
}
