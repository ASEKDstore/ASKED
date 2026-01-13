import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate current stock for a product by summing all inventory movements
   */
  async getCurrentStock(productId: string): Promise<number> {
    const result = await this.prisma.inventoryMovement.aggregate({
      where: { productId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity ?? 0;
  }

  /**
   * Get all products with their current stock and basic economics
   */
  async getAllStocks(): Promise<
    Array<{
      productId: string;
      title: string;
      sku: string | null;
      currentStock: number;
      costPrice: number | null;
      packagingCost: number | null;
      price: number;
      unitProfit: number | null;
      marginPercent: number | null;
    }>
  > {
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        title: true,
        sku: true,
        price: true,
        costPrice: true,
        packagingCost: true,
      },
    });

    const stocks = await Promise.all(
      products.map(async (product) => {
        const currentStock = await this.getCurrentStock(product.id);
        const unitProfit =
          product.costPrice !== null || product.packagingCost !== null
            ? product.price - (product.costPrice ?? 0) - (product.packagingCost ?? 0)
            : null;
        const marginPercent =
          unitProfit !== null && product.price > 0 ? (unitProfit / product.price) * 100 : null;

        return {
          productId: product.id,
          title: product.title,
          sku: product.sku,
          currentStock,
          costPrice: product.costPrice,
          packagingCost: product.packagingCost,
          price: product.price,
          unitProfit,
          marginPercent,
        };
      }),
    );

    return stocks;
  }

  /**
   * Get movements history with filters
   */
  async getMovementsHistory(params: {
    from?: Date;
    to?: Date;
    productId?: string;
    type?: 'IN' | 'OUT' | 'ADJUST';
    sourceType?: 'ORDER' | 'MANUAL' | 'PURCHASE';
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<{
      id: string;
      productId: string;
      productTitle: string;
      quantity: number;
      type: 'IN' | 'OUT' | 'ADJUST';
      sourceType: 'ORDER' | 'MANUAL' | 'PURCHASE';
      sourceId: string | null;
      note: string | null;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = params.page ?? 1;
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: {
      productId?: string;
      type?: 'IN' | 'OUT' | 'ADJUST';
      sourceType?: 'ORDER' | 'MANUAL' | 'PURCHASE';
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (params.productId) {
      where.productId = params.productId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.sourceType) {
      where.sourceType = params.sourceType;
    }

    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) {
        where.createdAt.gte = params.from;
      }
      if (params.to) {
        where.createdAt.lte = params.to;
      }
    }

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    const items = movements.map((movement) => ({
      id: movement.id,
      productId: movement.productId,
      productTitle: movement.product.title,
      quantity: movement.quantity,
      type: movement.type as 'IN' | 'OUT' | 'ADJUST',
      sourceType: movement.sourceType as 'ORDER' | 'MANUAL' | 'PURCHASE',
      sourceId: movement.sourceId,
      note: movement.note,
      createdAt: movement.createdAt,
    }));

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Calculate profit analytics for a given period
   * Only includes orders with deletedAt = null
   * By default, only counts DONE orders (completed orders)
   */
  async getProfitAnalytics(
    from: Date,
    to: Date,
    statusFilter?: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED',
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
  }> {
    // Build where clause for orders
    // Default to DONE status if no filter provided (only count completed orders)
    const orderWhere: {
      deletedAt: null;
      createdAt: { gte: Date; lte: Date };
      status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
    } = {
      deletedAt: null,
      createdAt: {
        gte: from,
        lte: to,
      },
      status: statusFilter ?? 'DONE', // Default to DONE (completed orders)
    };

    // Get all order items for the period
    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    let revenue = 0;
    let cogs = 0;
    let packaging = 0;
    const productMap = new Map<
      string,
      {
        productId: string;
        title: string;
        revenue: number;
        cogs: number;
        packaging: number;
        quantity: number;
      }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const itemRevenue = item.salePriceAtTime * item.qty;
        const itemCogs = (item.costPriceAtTime ?? 0) * item.qty;
        const itemPackaging = (item.packagingCostAtTime ?? 0) * item.qty;

        revenue += itemRevenue;
        cogs += itemCogs;
        packaging += itemPackaging;

        const productId = item.productId;
        const existing = productMap.get(productId);
        if (existing) {
          existing.revenue += itemRevenue;
          existing.cogs += itemCogs;
          existing.packaging += itemPackaging;
          existing.quantity += item.qty;
        } else {
          productMap.set(productId, {
            productId,
            title: item.product.title,
            revenue: itemRevenue,
            cogs: itemCogs,
            packaging: itemPackaging,
            quantity: item.qty,
          });
        }
      }
    }

    const grossProfit = revenue - cogs - packaging;
    const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Convert product breakdown to array and sort by profit descending
    const productBreakdown = Array.from(productMap.values())
      .map((p) => ({
        ...p,
        profit: p.revenue - p.cogs - p.packaging,
      }))
      .sort((a, b) => b.profit - a.profit);

    return {
      revenue,
      cogs,
      packaging,
      grossProfit,
      marginPercent,
      orderCount: orders.length,
      productBreakdown,
    };
  }

  /**
   * Create an inventory movement (IN)
   */
  async createInMovement(
    productId: string,
    quantity: number,
    note?: string,
  ): Promise<{ id: string; productId: string; quantity: number; createdAt: Date }> {
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId,
        quantity,
        type: 'IN',
        sourceType: 'MANUAL',
        sourceId: null,
        note: note || null,
      },
    });

    return {
      id: movement.id,
      productId: movement.productId,
      quantity: movement.quantity,
      createdAt: movement.createdAt,
    };
  }

  /**
   * Create an inventory adjustment movement
   */
  async createAdjustMovement(
    productId: string,
    quantityDelta: number,
    note?: string,
  ): Promise<{ id: string; productId: string; quantity: number; createdAt: Date }> {
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId,
        quantity: quantityDelta, // Can be positive or negative
        type: 'ADJUST',
        sourceType: 'MANUAL',
        sourceId: null,
        note: note || null,
      },
    });

    return {
      id: movement.id,
      productId: movement.productId,
      quantity: movement.quantity,
      createdAt: movement.createdAt,
    };
  }
}

