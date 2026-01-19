import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppOpensService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track app open event for a user
   * Creates or updates AppOpenEvent record
   */
  async trackAppOpen(telegramUserId: string, username?: string): Promise<void> {
    const userId = telegramUserId;

    await this.prisma.appOpenEvent.upsert({
      where: { userId },
      update: {
        username: username || undefined,
        lastOpenedAt: new Date(),
        opensCount: { increment: 1 },
      },
      create: {
        userId,
        username: username || null,
        firstOpenedAt: new Date(),
        lastOpenedAt: new Date(),
        opensCount: 1,
      },
    });
  }

  /**
   * Get app opens statistics
   */
  async getAppOpensStats(
    from?: Date,
    to?: Date,
  ): Promise<{
    totalUsers: number;
    newUsers: number;
    totalOpens: number;
  }> {
    const where =
      from || to
        ? {
            firstOpenedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {};

    const totalUsers = await this.prisma.appOpenEvent.count();

    const newUsers =
      from || to
        ? await this.prisma.appOpenEvent.count({
            where: {
              firstOpenedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            },
          })
        : 0;

    const result = await this.prisma.appOpenEvent.aggregate({
      _sum: {
        opensCount: true,
      },
      where,
    });

    return {
      totalUsers,
      newUsers,
      totalOpens: result._sum.opensCount || 0,
    };
  }

  /**
   * Get list of app opens events
   */
  async getAppOpensList(
    limit = 50,
    offset = 0,
  ): Promise<
    Array<{
      userId: string;
      username: string | null;
      firstOpenedAt: Date;
      lastOpenedAt: Date;
      opensCount: number;
    }>
  > {
    const events = await this.prisma.appOpenEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { lastOpenedAt: 'desc' },
      select: {
        userId: true,
        username: true,
        firstOpenedAt: true,
        lastOpenedAt: true,
        opensCount: true,
      },
    });

    return events;
  }
}
