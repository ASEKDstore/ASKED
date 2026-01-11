import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { MarkReadDto } from './dto/mark-read.dto';
import type { NotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<{ items: NotificationDto[]; nextCursor?: string }> {
    const where = {
      userId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    };

    const userNotifications = await this.prisma.userNotification.findMany({
      where,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      orderBy: { createdAt: 'desc' },
      include: {
        notification: true,
      },
    });

    const hasMore = userNotifications.length > limit;
    const items = hasMore ? userNotifications.slice(0, limit) : userNotifications;

    return {
      items: items.map((un) => ({
        id: un.id,
        notification: {
          type: un.notification.type,
          title: un.notification.title,
          body: un.notification.body,
          data: un.notification.data as Record<string, unknown> | null,
          createdAt: un.notification.createdAt.toISOString(),
        },
        isRead: un.isRead,
        readAt: un.readAt?.toISOString() || null,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.userNotification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, dto: MarkReadDto): Promise<{ updated: number }> {
    if (dto.all) {
      // Mark all unread notifications as read
      const result = await this.prisma.userNotification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return { updated: result.count };
    }

    if (dto.ids && dto.ids.length > 0) {
      // Mark specific notifications as read
      const result = await this.prisma.userNotification.updateMany({
        where: {
          userId,
          id: { in: dto.ids },
          isRead: false, // Only update unread ones
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return { updated: result.count };
    }

    return { updated: 0 };
  }

  /**
   * Create a notification and deliver it to user(s)
   */
  async createNotification(dto: CreateNotificationDto): Promise<{ notificationId: string }> {
    if (dto.target === 'ALL') {
      // Broadcast to all users
      return this.prisma.$transaction(async (tx) => {
        // Create notification
        const notification = await tx.notification.create({
          data: {
            type: dto.type,
            title: dto.title,
            body: dto.body,
            ...(dto.data ? { data: dto.data as never } : {}),
          },
        });

        // Get all user IDs
        const users = await tx.user.findMany({
          select: { id: true },
        });

        // Create UserNotification for each user (batch insert)
        if (users.length > 0) {
          await tx.userNotification.createMany({
            data: users.map((u) => ({
              userId: u.id,
              notificationId: notification.id,
              isRead: false,
            })),
          });
        }

        return { notificationId: notification.id };
      });
    }

    if (dto.target === 'USER') {
      // Direct notification to a specific user
      if (!dto.userId) {
        throw new Error('userId is required for USER target');
      }

      const userId = dto.userId; // TypeScript now knows this is string

      return this.prisma.$transaction(async (tx) => {
        // Verify user exists
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new NotFoundException(`User with id ${userId} not found`);
        }

        // Create notification
        const notification = await tx.notification.create({
          data: {
            type: dto.type,
            title: dto.title,
            body: dto.body,
            ...(dto.data ? { data: dto.data as never } : {}),
          },
        });

        // Create UserNotification
        await tx.userNotification.create({
          data: {
            userId,
            notificationId: notification.id,
            isRead: false,
          },
        });

        return { notificationId: notification.id };
      });
    }

    throw new Error('Invalid notification target');
  }

  /**
   * Create order notification (helper for order hooks)
   */
  async createOrderNotification(
    type: 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED',
    userId: string,
    orderId: string,
    orderNumber: string,
    statusText?: string,
  ): Promise<void> {
    if (type === 'ORDER_CREATED') {
      await this.createNotification({
        type: 'ORDER_CREATED',
        title: 'Заказ создан',
        body: `Заказ ${orderNumber} принят`,
        data: {
          orderId,
          orderNumber,
          deepLink: `/orders?open=${orderId}`,
        },
        target: 'USER',
        userId,
      });
    } else if (type === 'ORDER_STATUS_CHANGED') {
      const statusMessages: Record<string, string> = {
        NEW: 'новый',
        CONFIRMED: 'подтверждён',
        IN_PROGRESS: 'в обработке',
        DONE: 'выполнен',
        CANCELED: 'отменён',
      };

      const statusMessage = statusText || statusMessages['NEW'] || 'изменён';

      await this.createNotification({
        type: 'ORDER_STATUS_CHANGED',
        title: 'Статус заказа изменён',
        body: `Статус заказа ${orderNumber} изменён: ${statusMessage}`,
        data: {
          orderId,
          orderNumber,
          ...(statusText ? { status: statusText } : {}),
          deepLink: `/orders?open=${orderId}`,
        },
        target: 'USER',
        userId,
      });
    }
  }
}
