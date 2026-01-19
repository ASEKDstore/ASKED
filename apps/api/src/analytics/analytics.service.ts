import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';

import type {
  AnalyticsQueryDto,
  TelegramPostsQueryDto,
  ShopProductsQueryDto,
  FunnelQueryDto,
} from './dto/analytics-query.dto';
import type {
  AnalyticsOverviewDto,
  TelegramSubscribersResponse,
  TelegramPostsResponse,
  TopProductsResponse,
  FunnelResponse,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getOverview(query: AnalyticsQueryDto): Promise<AnalyticsOverviewDto> {
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();

    // Get current subscriber count (latest snapshot)
    const latestSnapshot = await this.prisma.telegramChannelSnapshot.findFirst({
      where: {
        channelId: this.configService.get<string>('TELEGRAM_CHANNEL_ID', ''),
      },
      orderBy: { snapshotAt: 'desc' },
    });

    const previousSnapshot = await this.prisma.telegramChannelSnapshot.findFirst({
      where: {
        channelId: this.configService.get<string>('TELEGRAM_CHANNEL_ID', ''),
        snapshotAt: { lt: from },
      },
      orderBy: { snapshotAt: 'desc' },
    });

    const subscribersNow = latestSnapshot?.subscriberCount || 0;
    const subscribersGrowth = previousSnapshot
      ? subscribersNow - previousSnapshot.subscriberCount
      : 0;

    // Get orders in period (exclude soft-deleted orders)
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: 'CANCELED' },
        deletedAt: null, // Exclude soft-deleted orders
      },
    });

    const ordersCount = orders.length;
    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const aov = ordersCount > 0 ? revenue / ordersCount : 0;

    // Get conversion funnel data
    const pageViews = await this.prisma.appEvent.count({
      where: {
        eventType: 'PAGE_VIEW',
        createdAt: { gte: from, lte: to },
      },
    });

    const purchases = await this.prisma.appEvent.count({
      where: {
        eventType: 'PURCHASE',
        createdAt: { gte: from, lte: to },
      },
    });

    const conversion = pageViews > 0 ? (purchases / pageViews) * 100 : 0;

    return {
      subscribersNow,
      subscribersGrowth,
      ordersCount,
      revenue,
      conversion: Math.round(conversion * 100) / 100,
      aov: Math.round(aov),
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    };
  }

  async getTelegramSubscribers(query: AnalyticsQueryDto): Promise<TelegramSubscribersResponse> {
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();
    const granularity = query.granularity || 'day';

    const channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID', '');

    // Get snapshots in period
    const snapshots = await this.prisma.telegramChannelSnapshot.findMany({
      where: {
        channelId,
        snapshotAt: { gte: from, lte: to },
      },
      orderBy: { snapshotAt: 'asc' },
    });

    // Group by granularity
    const grouped = new Map<string, { count: number; date: Date }>();

    for (const snapshot of snapshots) {
      const date = new Date(snapshot.snapshotAt);
      let key: string;

      const pad = (n: number) => String(n).padStart(2, '0');

      if (granularity === 'hour') {
        key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00:00`;
      } else if (granularity === 'day') {
        key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      } else if (granularity === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${pad(Math.ceil((weekStart.getDate() + 6) / 7))}`;
      } else {
        // month
        key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      }

      const existing = grouped.get(key);
      if (!existing || snapshot.snapshotAt > existing.date) {
        grouped.set(key, { count: snapshot.subscriberCount, date: snapshot.snapshotAt });
      }
    }

    // Convert to array and calculate growth
    const data = Array.from(grouped.entries())
      .map(([dateStr, { count }], index, arr) => {
        const prev = index > 0 ? arr[index - 1][1].count : count;
        return {
          date: dateStr,
          count,
          growth: count - prev,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      data,
      granularity,
    };
  }

  async getTopTelegramPosts(query: TelegramPostsQueryDto): Promise<TelegramPostsResponse> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const limit = query.limit || 20;

    const channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID', '');

    const posts = await this.prisma.telegramPost.findMany({
      where: {
        channelId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { views: 'desc' },
      take: limit,
    });

    return {
      items: posts.map((post) => ({
        id: post.id,
        channelId: post.channelId,
        messageId: post.messageId,
        date: post.date.toISOString(),
        textExcerpt: post.textExcerpt,
        views: post.views,
        forwards: post.forwards,
        link: post.link,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      total: posts.length,
    };
  }

  async getTopProducts(query: ShopProductsQueryDto): Promise<TopProductsResponse> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const metric = query.metric || 'orders';
    const limit = query.limit || 20;

    if (metric === 'orders') {
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
            status: { not: 'CANCELED' },
            deletedAt: null, // Exclude soft-deleted orders
          },
        },
        include: {
          product: true,
        },
      });

      const productMap = new Map<string, { title: string; count: number }>();

      for (const item of orderItems) {
        const existing = productMap.get(item.productId);
        productMap.set(item.productId, {
          title: item.product.title,
          count: (existing?.count || 0) + item.qty,
        });
      }

      const items = Array.from(productMap.entries())
        .map(([productId, { title, count }]) => ({
          productId,
          productTitle: title,
          metric: count,
          metricType: 'orders' as const,
        }))
        .sort((a, b) => b.metric - a.metric)
        .slice(0, limit);

      return { items };
    } else if (metric === 'revenue') {
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
            status: { not: 'CANCELED' },
            deletedAt: null, // Exclude soft-deleted orders
          },
        },
        include: {
          product: true,
        },
      });

      const productMap = new Map<string, { title: string; revenue: number }>();

      for (const item of orderItems) {
        const existing = productMap.get(item.productId);
        productMap.set(item.productId, {
          title: item.product.title,
          revenue: (existing?.revenue || 0) + item.priceSnapshot * item.qty,
        });
      }

      const items = Array.from(productMap.entries())
        .map(([productId, { title, revenue }]) => ({
          productId,
          productTitle: title,
          metric: revenue,
          metricType: 'revenue' as const,
        }))
        .sort((a, b) => b.metric - a.metric)
        .slice(0, limit);

      return { items };
    } else {
      // views
      const events = await this.prisma.appEvent.findMany({
        where: {
          eventType: 'PRODUCT_VIEW',
          productId: { not: null },
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        },
      });

      const productMap = new Map<string, number>();

      for (const event of events) {
        if (event.productId) {
          productMap.set(event.productId, (productMap.get(event.productId) || 0) + 1);
        }
      }

      // Get product titles
      const productIds = Array.from(productMap.keys());
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productTitleMap = new Map(products.map((p) => [p.id, p.title]));

      const items = Array.from(productMap.entries())
        .map(([productId, count]) => ({
          productId,
          productTitle: productTitleMap.get(productId) || 'Unknown',
          metric: count,
          metricType: 'views' as const,
        }))
        .sort((a, b) => b.metric - a.metric)
        .slice(0, limit);

      return { items };
    }
  }

  async getFunnel(query: FunnelQueryDto): Promise<FunnelResponse> {
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();

    // Get unique user counts per event type (for funnel analysis)
    const [
      pageViewEvents,
      productViewEvents,
      addToCartEvents,
      checkoutStartedEvents,
      purchaseEvents,
    ] = await Promise.all([
      this.prisma.appEvent.findMany({
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: { gte: from, lte: to },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.appEvent.findMany({
        where: {
          eventType: 'PRODUCT_VIEW',
          createdAt: { gte: from, lte: to },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.appEvent.findMany({
        where: {
          eventType: 'ADD_TO_CART',
          createdAt: { gte: from, lte: to },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.appEvent.findMany({
        where: {
          eventType: 'CHECKOUT_STARTED',
          createdAt: { gte: from, lte: to },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.appEvent.findMany({
        where: {
          eventType: 'PURCHASE',
          createdAt: { gte: from, lte: to },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    const pageViews = pageViewEvents.length;
    const productViews = productViewEvents.length;
    const addToCart = addToCartEvents.length;
    const checkoutStarted = checkoutStartedEvents.length;
    const purchases = purchaseEvents.length;

    const funnel = [
      {
        stage: 'Просмотры страниц',
        count: pageViews,
        percentage: 100,
      },
      {
        stage: 'Просмотры товаров',
        count: productViews,
        percentage: pageViews > 0 ? (productViews / pageViews) * 100 : 0,
      },
      {
        stage: 'Добавлено в корзину',
        count: addToCart,
        percentage: productViews > 0 ? (addToCart / productViews) * 100 : 0,
      },
      {
        stage: 'Начало оформления',
        count: checkoutStarted,
        percentage: addToCart > 0 ? (checkoutStarted / addToCart) * 100 : 0,
      },
      {
        stage: 'Покупки',
        count: purchases,
        percentage: checkoutStarted > 0 ? (purchases / checkoutStarted) * 100 : 0,
      },
    ].map((item) => ({
      ...item,
      percentage: Math.round(item.percentage * 100) / 100,
    }));

    return {
      funnel,
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    };
  }
}
