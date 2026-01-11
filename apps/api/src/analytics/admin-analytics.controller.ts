import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';

import { AnalyticsService } from './analytics.service';
import { AppOpensService } from './app-opens.service';
import type {
  AnalyticsOverviewDto,
  TelegramSubscribersResponse,
  TelegramPostsResponse,
  TopProductsResponse,
  FunnelResponse,
  AppUsersStatsResponse,
  AppUsersListResponse,
} from './dto/analytics.dto';
import {
  analyticsQuerySchema,
  telegramPostsQuerySchema,
  shopProductsQuerySchema,
  funnelQuerySchema,
} from './dto/analytics-query.dto';

@Controller('admin/analytics')
@UseGuards(DevAdminAuthGuard, AdminGuard)
export class AdminAnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly appOpensService: AppOpensService,
  ) {}

  @Get('overview')
  async getOverview(@Query() query: any): Promise<AnalyticsOverviewDto> {
    const validatedQuery = analyticsQuerySchema.parse(query);
    return this.analyticsService.getOverview(validatedQuery);
  }

  @Get('telegram/subscribers')
  async getTelegramSubscribers(@Query() query: any): Promise<TelegramSubscribersResponse> {
    const validatedQuery = analyticsQuerySchema.parse(query);
    return this.analyticsService.getTelegramSubscribers(validatedQuery);
  }

  @Get('telegram/posts/top')
  async getTopTelegramPosts(@Query() query: any): Promise<TelegramPostsResponse> {
    const validatedQuery = telegramPostsQuerySchema.parse(query);
    return this.analyticsService.getTopTelegramPosts(validatedQuery);
  }

  @Get('shop/products/top')
  async getTopProducts(@Query() query: any): Promise<TopProductsResponse> {
    const validatedQuery = shopProductsQuerySchema.parse(query);
    return this.analyticsService.getTopProducts(validatedQuery);
  }

  @Get('funnel')
  async getFunnel(@Query() query: any): Promise<FunnelResponse> {
    const validatedQuery = funnelQuerySchema.parse(query);
    return this.analyticsService.getFunnel(validatedQuery);
  }

  @Get('app-users/stats')
  async getAppUsersStats(@Query() query: any): Promise<AppUsersStatsResponse> {
    const validatedQuery = analyticsQuerySchema.parse(query);
    const from = validatedQuery.from ? new Date(validatedQuery.from) : undefined;
    const to = validatedQuery.to ? new Date(validatedQuery.to) : undefined;

    const stats = await this.appOpensService.getAppOpensStats(from, to);

    // Calculate active users (users who opened app in period)
    // For simplicity, use total users if no period specified
    // In production, you'd query lastOpenedAt in the period
    const activeUsers = stats.totalUsers; // Simplified - in production query lastOpenedAt in period

    return {
      totalUsers: stats.totalUsers,
      newUsers: stats.newUsers,
      activeUsers,
      ...(from && to
        ? {
            period: {
              from: from.toISOString(),
              to: to.toISOString(),
            },
          }
        : {}),
    };
  }

  @Get('app-users')
  async getAppUsers(@Query() query: any): Promise<AppUsersListResponse> {
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    const users = await this.appOpensService.getAppOpensList(limit, offset);
    const total = await this.appOpensService.getAppOpensStats().then((s) => s.totalUsers);

    return {
      items: users.map((u) => ({
        userId: u.userId,
        username: u.username,
        firstOpenedAt: u.firstOpenedAt.toISOString(),
        lastOpenedAt: u.lastOpenedAt.toISOString(),
        opensCount: u.opensCount,
      })),
      total,
    };
  }
}

