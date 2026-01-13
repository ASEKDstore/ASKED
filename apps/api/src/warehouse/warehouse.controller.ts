import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Header,
  BadRequestException,
} from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import { PurchasesService } from './purchases.service';
import { WarehouseService } from './warehouse.service';

@Controller('admin/warehouse')
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly purchasesService: PurchasesService,
  ) {}

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
      unitProfit: number | null;
      marginPercent: number | null;
    }>;
  }> {
    const items = await this.warehouseService.getAllStocks();
    return { items };
  }

  @Get('movements')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMovements(
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: 'IN' | 'OUT' | 'ADJUST',
    @Query('sourceType') sourceType?: 'ORDER' | 'MANUAL' | 'PURCHASE',
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ): Promise<{
    items: Array<{
      id: string;
      productId: string;
      productTitle: string;
      quantity: number;
      type: 'IN' | 'OUT' | 'ADJUST';
      sourceType: 'ORDER' | 'MANUAL' | 'PURCHASE';
      sourceId: string | null;
      note: string | null;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : undefined;

    const result = await this.warehouseService.getMovementsHistory({
      from,
      to,
      productId,
      type,
      sourceType,
      page,
      pageSize,
    });

    return {
      items: result.items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
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

  // Purchase endpoints
  @Get('purchases')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getPurchases(
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'DRAFT' | 'POSTED' | 'CANCELED',
  ): Promise<{
    items: Array<{
      id: string;
      supplier: string | null;
      comment: string | null;
      status: 'DRAFT' | 'POSTED' | 'CANCELED';
      postedAt: string | null;
      createdAt: string;
      updatedAt: string;
      itemsCount: number;
      totalCost: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : undefined;

    const result = await this.purchasesService.findAll({
      page,
      pageSize,
      search,
      status,
    });

    return {
      items: result.items.map((item) => ({
        ...item,
        postedAt: item.postedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @Get('purchases/:id')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getPurchase(@Param('id') id: string): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT' | 'POSTED' | 'CANCELED';
    postedAt: string | null;
    createdAt: string;
    updatedAt: string;
    items: Array<{
      id: string;
      productId: string;
      product: {
        id: string;
        title: string;
        sku: string | null;
      };
      qty: number;
      unitCost: number;
    }>;
  }> {
    const purchase = await this.purchasesService.findOne(id);
    return {
      ...purchase,
      postedAt: purchase.postedAt?.toISOString() ?? null,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
    };
  }

  @Post('purchases')
  async createPurchase(
    @Body()
    body: {
      supplier?: string;
      comment?: string;
      items: Array<{
        productId: string;
        qty: number;
        unitCost: number;
      }>;
    },
  ): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT';
    createdAt: string;
    items: Array<{
      id: string;
      productId: string;
      qty: number;
      unitCost: number;
    }>;
  }> {
    const purchase = await this.purchasesService.create(body);
    return {
      ...purchase,
      createdAt: purchase.createdAt.toISOString(),
    };
  }

  @Patch('purchases/:id')
  async updatePurchase(
    @Param('id') id: string,
    @Body()
    body: {
      supplier?: string;
      comment?: string;
      items?: Array<{
        productId: string;
        qty: number;
        unitCost: number;
      }>;
    },
  ): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT' | 'POSTED' | 'CANCELED';
    updatedAt: string;
  }> {
    const purchase = await this.purchasesService.update(id, body);
    return {
      ...purchase,
      updatedAt: purchase.updatedAt.toISOString(),
    };
  }

  @Post('purchases/:id/post')
  async postPurchase(
    @Param('id') id: string,
    @Body()
    body?: {
      updateCostPrice?: boolean;
    },
  ): Promise<{
    id: string;
    status: 'POSTED';
    postedAt: string;
    movementsCreated: number;
  }> {
    const result = await this.purchasesService.post(id, body);
    return {
      ...result,
      postedAt: result.postedAt.toISOString(),
    };
  }

  @Post('purchases/:id/cancel')
  async cancelPurchase(@Param('id') id: string): Promise<{
    id: string;
    status: 'CANCELED';
  }> {
    return this.purchasesService.cancel(id);
  }

  @Post('writeoffs')
  async createWriteOff(
    @Body()
    body: {
      productId: string;
      qty: number;
      reason?: string;
    },
  ): Promise<{
    id: string;
    productId: string;
    qty: number;
    totalCost: number;
    createdAt: string;
  }> {
    if (!body.productId) {
      throw new BadRequestException('productId is required');
    }
    if (!body.qty || body.qty <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const writeOff = await this.warehouseService.createWriteOff(
      body.productId,
      body.qty,
      body.reason,
    );

    return {
      ...writeOff,
      createdAt: writeOff.createdAt.toISOString(),
    };
  }
}

