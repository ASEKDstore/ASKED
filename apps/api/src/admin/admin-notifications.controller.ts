import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import type { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { createNotificationSchema } from '../notifications/dto/create-notification.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('admin/notifications')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  async broadcast(@Body() body: unknown): Promise<{ notificationId: string }> {
    const parsed = createNotificationSchema.parse(body);
    const dto: CreateNotificationDto = {
      title: parsed.title,
      body: parsed.body,
      ...(parsed.data ? { data: parsed.data } : {}),
      type: 'ADMIN_BROADCAST',
      target: 'ALL',
    };

    return this.notificationsService.createNotification(dto);
  }

  @Post('user/:userId')
  async notifyUser(
    @Param('userId') userId: string,
    @Body() body: unknown,
  ): Promise<{ notificationId: string }> {
    const parsed = createNotificationSchema.parse(body);
    const dto: CreateNotificationDto = {
      title: parsed.title,
      body: parsed.body,
      ...(parsed.data ? { data: parsed.data } : {}),
      type: 'ADMIN_DIRECT',
      target: 'USER',
      userId,
    };

    return this.notificationsService.createNotification(dto);
  }
}
