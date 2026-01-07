import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';

import { AnalyticsService } from './analytics.service';
import type {
  AnalyticsOverviewDto,
  TelegramSubscribersResponse,
  TelegramPostsResponse,
  TopProductsResponse,
  FunnelResponse,
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
  constructor(private readonly analyticsService: AnalyticsService) {}

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
}

