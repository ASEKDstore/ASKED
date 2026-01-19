import { Controller, Post, Param, Body, UseGuards, Logger } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import {
  adminBroadcastNotificationSchema,
  adminDirectNotificationSchema,
} from '../notifications/dto/create-notification.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('admin/notifications')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminNotificationsController {
  private readonly logger = new Logger(AdminNotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  async broadcast(
    @Body() body: unknown,
  ): Promise<{ notificationId: string; delivered: number; totalUsers: number }> {
    try {
      const parsed = adminBroadcastNotificationSchema.parse(body);
      const dto: CreateNotificationDto = {
        title: parsed.title,
        body: parsed.body,
        ...(parsed.data ? { data: parsed.data } : {}),
        type: 'ADMIN_BROADCAST',
        target: 'ALL',
      };

      const result = await this.notificationsService.createNotification(dto);
      return {
        notificationId: result.notificationId,
        delivered: result.delivered ?? 0,
        totalUsers: result.totalUsers ?? 0,
      };
    } catch (error) {
      // Log the real error with full details
      this.logger.error(
        'Failed to send broadcast notification',
        error instanceof Error ? error.message : String(error),
      );
      this.logger.error(
        'Error stack trace:',
        error instanceof Error ? error.stack : 'No stack trace available',
      );

      // Broadcast must NEVER crash - always return 200 with delivered=0
      // This handles validation errors or any other unexpected errors
      return {
        notificationId: 'error',
        delivered: 0,
        totalUsers: 0,
      };
    }
  }

  @Post('user/:userId')
  async notifyUser(
    @Param('userId') userId: string,
    @Body() body: unknown,
  ): Promise<{ notificationId: string }> {
    const parsed = adminDirectNotificationSchema.parse(body);
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
