import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { MarkReadDto } from './dto/mark-read.dto';
import type { NotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<{ items: NotificationDto[]; nextCursor?: string }> {
    try {
      if (!userId) {
        this.logger.warn('getUserNotifications called with empty userId');
        return { items: [] };
      }

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
    } catch (error) {
      this.logger.error(
        `Failed to get user notifications for userId=${userId}, cursor=${cursor || 'none'}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Return empty list instead of throwing to prevent 500 errors
      return { items: [] };
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!userId) {
        this.logger.warn('getUnreadCount called with empty userId');
        return 0;
      }

      return await this.prisma.userNotification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get unread count for userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Return 0 instead of throwing to prevent 500 errors
      return 0;
    }
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
  async createNotification(dto: CreateNotificationDto): Promise<{ notificationId: string; delivered?: number; totalUsers?: number }> {
    if (dto.target === 'ALL') {
      // Broadcast to all users - MUST NEVER crash
      try {
        return await this.prisma.$transaction(async (tx) => {
          // Create notification first (always create, even if no users)
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

          const totalUsers = users.length;
          this.logger.log(`Broadcast notification created: ${notification.id}, found ${totalUsers} users`);

          // Handle empty users gracefully - return success with delivered: 0
          if (totalUsers === 0) {
            this.logger.warn(`Broadcast notification created but no users found to deliver to`);
            return { notificationId: notification.id, delivered: 0, totalUsers: 0 };
          }

          // Create UserNotification for each user (batch insert)
          // Batch insert in chunks of 1000 to avoid Prisma limits
          const batchSize = 1000;
          let totalCreated = 0;

          for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            // Ensure batch is not empty before calling createMany
            if (batch.length > 0) {
              const result = await tx.userNotification.createMany({
                data: batch.map((u) => ({
                  userId: u.id,
                  notificationId: notification.id,
                  isRead: false,
                })),
                skipDuplicates: true,
              });
              totalCreated += result.count;
            }
          }

          this.logger.log(`Broadcast notification delivered to ${totalCreated} users`);
          return { notificationId: notification.id, delivered: totalCreated, totalUsers };
        });
      } catch (error) {
        // Log the real error with full details
        this.logger.error(
          `Failed to create broadcast notification: ${dto.title}`,
          error instanceof Error ? error.message : String(error),
        );
        this.logger.error(
          `Error stack trace:`,
          error instanceof Error ? error.stack : 'No stack trace available',
        );
        
        // For broadcast, we should still try to create the notification record for logging
        // But if that also fails, return a safe response
        try {
          const notification = await this.prisma.notification.create({
            data: {
              type: dto.type,
              title: dto.title,
              body: dto.body,
              ...(dto.data ? { data: dto.data as never } : {}),
            },
          });
          this.logger.warn(`Notification created but delivery failed: ${notification.id}`);
          return { notificationId: notification.id, delivered: 0, totalUsers: 0 };
        } catch (fallbackError) {
          // Even notification creation failed - return error response but don't throw
          this.logger.error(
            `Critical: Failed to create notification record: ${dto.title}`,
            fallbackError instanceof Error ? fallbackError.stack : String(fallbackError),
          );
          // Return a safe response - broadcast must NEVER crash
          return { notificationId: 'error', delivered: 0, totalUsers: 0 };
        }
      }
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
   * Create targeted notification for multiple users
   * More efficient than calling createNotification multiple times
   */
  async createTargetedNotification(
    dto: Omit<CreateNotificationDto, 'target' | 'userId'>,
    userIds: string[],
  ): Promise<{ notificationId: string; recipientsCount: number }> {
    if (userIds.length === 0) {
      throw new Error('At least one user ID is required');
    }

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

      // Create UserNotification for each user (batch insert)
      // Prisma createMany has a limit, so we batch in chunks of 1000
      const batchSize = 1000;
      let totalCreated = 0;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        await tx.userNotification.createMany({
          data: batch.map((userId) => ({
            userId,
            notificationId: notification.id,
            isRead: false,
          })),
          skipDuplicates: true, // Skip if duplicate (shouldn't happen, but safe)
        });
        totalCreated += batch.length;
      }

      return {
        notificationId: notification.id,
        recipientsCount: totalCreated,
      };
    });
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
