import { Controller, Get, Post, Body, Query, UseGuards, Header, BadRequestException } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import { WarehouseService } from './warehouse.service';

@Controller('admin/warehouse')
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('stock')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getStock(): Promise<{
    items: Array<{
      productId: string;
      title: string;
      sku: string | null;
      currentStock: number;
      costPrice: number | null;
      packagingCost: number | null;
      price: number;
    }>;
  }> {
    const items = await this.warehouseService.getAllStocks();
    return { items };
  }

  @Get('profit')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getProfit(
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('status') status?: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED',
  ): Promise<{
    revenue: number;
    cogs: number;
    packaging: number;
    grossProfit: number;
    marginPercent: number;
    orderCount: number;
    productBreakdown: Array<{
      productId: string;
      title: string;
      revenue: number;
      cogs: number;
      packaging: number;
      profit: number;
      quantity: number;
    }>;
    period: {
      from: string;
      to: string;
    };
  }> {
    // Default to last 30 days if not provided
    const to = toStr ? new Date(toStr) : new Date();
    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analytics = await this.warehouseService.getProfitAnalytics(from, to, status);

    return {
      ...analytics,
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    };
  }

  @Post('movements/in')
  async createInMovement(
    @Body()
    body: {
      productId: string;
      qty: number;
      note?: string;
    },
  ): Promise<{
    id: string;
    productId: string;
    quantity: number;
    createdAt: string;
  }> {
    if (!body.productId) {
      throw new BadRequestException('productId is required');
    }
    if (!body.qty || body.qty <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const movement = await this.warehouseService.createInMovement(
      body.productId,
      body.qty,
      body.note,
    );

    return {
      ...movement,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  @Post('movements/adjust')
  async createAdjustMovement(
    @Body()
    body: {
      productId: string;
      qtyDelta: number;
      note?: string;
    },
  ): Promise<{
    id: string;
    productId: string;
    quantity: number;
    createdAt: string;
  }> {
    if (!body.productId) {
      throw new BadRequestException('productId is required');
    }
    if (body.qtyDelta === 0) {
      throw new BadRequestException('Quantity delta cannot be zero');
    }

    const movement = await this.warehouseService.createAdjustMovement(
      body.productId,
      body.qtyDelta,
      body.note,
    );

    return {
      ...movement,
      createdAt: movement.createdAt.toISOString(),
    };
  }
}

