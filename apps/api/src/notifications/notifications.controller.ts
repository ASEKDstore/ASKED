import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';

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
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('my')
  @UseGuards(TelegramAuthGuard)
  async getMyNotifications(
    @CurrentTelegramUser() telegramUser: TelegramUser,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<NotificationsListResponse> {
    // Get or create user
    const user = await this.usersService.upsertByTelegramData(telegramUser);

    const limitNum = limit ? parseInt(limit, 10) : 20;
    const safeLimit = Math.min(Math.max(limitNum, 1), 100); // Clamp between 1 and 100

    return this.notificationsService.getUserNotifications(user.id, safeLimit, cursor);
  }

  @Get('my/unread-count')
  @UseGuards(TelegramAuthGuard)
  async getUnreadCount(@CurrentTelegramUser() telegramUser: TelegramUser): Promise<UnreadCountResponse> {
    // Get or create user
    const user = await this.usersService.upsertByTelegramData(telegramUser);

    const unreadCount = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount };
  }

  @Post('my/mark-read')
  @UseGuards(TelegramAuthGuard)
  async markAsRead(
    @CurrentTelegramUser() telegramUser: TelegramUser,
    @Body() body: unknown,
  ): Promise<MarkReadResponse> {
    // Get or create user
    const user = await this.usersService.upsertByTelegramData(telegramUser);

    const dto = markReadSchema.parse(body);
    return this.notificationsService.markAsRead(user.id, dto);
  }
}

