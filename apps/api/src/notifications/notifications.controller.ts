import { Controller, Get, Post, Body, Query, UseGuards, Logger, UnauthorizedException } from '@nestjs/common';

import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { CurrentTelegramUser } from '../auth/decorators/current-telegram-user.decorator';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { UsersService } from '../users/users.service';

import { markReadSchema } from './dto/mark-read.dto';
import type {
  NotificationsListResponse,
  UnreadCountResponse,
  MarkReadResponse,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('my')
  @UseGuards(TelegramAuthGuard)
  async getMyNotifications(
    @CurrentTelegramUser() telegramUser: TelegramUser | undefined,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<NotificationsListResponse> {
    try {
      if (!telegramUser) {
        this.logger.warn('getMyNotifications: telegramUser is undefined');
        throw new UnauthorizedException('User not authenticated');
      }

      // Get or create user
      const user = await this.usersService.upsertByTelegramData(telegramUser);

      if (!user?.id) {
        this.logger.error('getMyNotifications: user.id is missing after upsert', { userId: user?.id, telegramId: telegramUser.id });
        throw new UnauthorizedException('User ID not found');
      }

      const limitNum = limit ? parseInt(limit, 10) : 20;
      const safeLimit = Math.min(Math.max(limitNum, 1), 100); // Clamp between 1 and 100

      return await this.notificationsService.getUserNotifications(user.id, safeLimit, cursor);
    } catch (error) {
      this.logger.error(
        'getMyNotifications failed',
        error instanceof Error ? error.stack : String(error),
      );
      // Re-throw auth errors, but catch others and return empty list
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For other errors, return empty list to prevent 500
      return { items: [] };
    }
  }

  @Get('my/unread-count')
  @UseGuards(TelegramAuthGuard)
  async getUnreadCount(@CurrentTelegramUser() telegramUser: TelegramUser | undefined): Promise<UnreadCountResponse> {
    try {
      if (!telegramUser) {
        this.logger.warn('getUnreadCount: telegramUser is undefined');
        throw new UnauthorizedException('User not authenticated');
      }

      // Get or create user
      const user = await this.usersService.upsertByTelegramData(telegramUser);

      if (!user?.id) {
        this.logger.error('getUnreadCount: user.id is missing after upsert', { userId: user?.id, telegramId: telegramUser.id });
        throw new UnauthorizedException('User ID not found');
      }

      const unreadCount = await this.notificationsService.getUnreadCount(user.id);
      return { unreadCount };
    } catch (error) {
      this.logger.error(
        'getUnreadCount failed',
        error instanceof Error ? error.stack : String(error),
      );
      // Re-throw auth errors, but return 0 for others
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return { unreadCount: 0 };
    }
  }

  @Post('my/mark-read')
  @UseGuards(TelegramAuthGuard)
  async markAsRead(
    @CurrentTelegramUser() telegramUser: TelegramUser | undefined,
    @Body() body: unknown,
  ): Promise<MarkReadResponse> {
    if (!telegramUser) {
      this.logger.warn('markAsRead: telegramUser is undefined');
      throw new UnauthorizedException('User not authenticated');
    }

    // Get or create user
    const user = await this.usersService.upsertByTelegramData(telegramUser);

    if (!user?.id) {
      this.logger.error('markAsRead: user.id is missing after upsert', { userId: user?.id, telegramId: telegramUser.id });
      throw new UnauthorizedException('User ID not found');
    }

    const dto = markReadSchema.parse(body);
    return this.notificationsService.markAsRead(user.id, dto);
  }
}

