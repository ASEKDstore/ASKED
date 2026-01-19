import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface CreatePurchaseDto {
  supplier?: string;
  comment?: string;
  items: Array<{
    productId: string;
    qty: number;
    unitCost: number;
  }>;
}

export interface UpdatePurchaseDto {
  supplier?: string;
  comment?: string;
  items?: Array<{
    productId: string;
    qty: number;
    unitCost: number;
  }>;
}

export interface PostPurchaseDto {
  updateCostPrice?: boolean; // If true, update product.costPrice with unitCost from purchase items
}

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'DRAFT' | 'POSTED' | 'CANCELED';
  }): Promise<{
    items: Array<{
      id: string;
      supplier: string | null;
      comment: string | null;
      status: 'DRAFT' | 'POSTED' | 'CANCELED';
      postedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      itemsCount: number;
      totalCost: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = params.page ?? 1;
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: {
      status?: 'DRAFT' | 'POSTED' | 'CANCELED';
      OR?: Array<{
        supplier?: { contains: string; mode: 'insensitive' };
        comment?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { supplier: { contains: params.search, mode: 'insensitive' } },
        { comment: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [purchases, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    const items = purchases.map((purchase) => {
      const totalCost = purchase.items.reduce((sum, item) => sum + item.unitCost * item.qty, 0);
      return {
        id: purchase.id,
        supplier: purchase.supplier,
        comment: purchase.comment,
        status: purchase.status as 'DRAFT' | 'POSTED' | 'CANCELED',
        postedAt: purchase.postedAt,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
        itemsCount: purchase.items.length,
        totalCost,
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT' | 'POSTED' | 'CANCELED';
    postedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
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
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase with id ${id} not found`);
    }

    return {
      id: purchase.id,
      supplier: purchase.supplier,
      comment: purchase.comment,
      status: purchase.status as 'DRAFT' | 'POSTED' | 'CANCELED',
      postedAt: purchase.postedAt,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      items: purchase.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product.id,
          title: item.product.title,
          sku: item.product.sku,
        },
        qty: item.qty,
        unitCost: item.unitCost,
      })),
    };
  }

  async create(dto: CreatePurchaseDto): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT';
    createdAt: Date;
    items: Array<{
      id: string;
      productId: string;
      qty: number;
      unitCost: number;
    }>;
  }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase must have at least one item');
    }

    // Validate products exist
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Validate quantities and costs
    for (const item of dto.items) {
      if (item.qty <= 0) {
        throw new BadRequestException('Quantity must be positive');
      }
      if (item.unitCost < 0) {
        throw new BadRequestException('Unit cost cannot be negative');
      }
    }

    const purchase = await this.prisma.purchase.create({
      data: {
        supplier: dto.supplier || null,
        comment: dto.comment || null,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            unitCost: item.unitCost,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return {
      id: purchase.id,
      supplier: purchase.supplier,
      comment: purchase.comment,
      status: 'DRAFT',
      createdAt: purchase.createdAt,
      items: purchase.items,
    };
  }

  async update(
    id: string,
    dto: UpdatePurchaseDto,
  ): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT' | 'POSTED' | 'CANCELED';
    updatedAt: Date;
  }> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase with id ${id} not found`);
    }

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT purchases can be edited');
    }

    // If items are provided, validate and replace them
    if (dto.items !== undefined) {
      if (dto.items.length === 0) {
        throw new BadRequestException('Purchase must have at least one item');
      }

      // Validate products exist
      const productIds = dto.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      // Validate quantities and costs
      for (const item of dto.items) {
        if (item.qty <= 0) {
          throw new BadRequestException('Quantity must be positive');
        }
        if (item.unitCost < 0) {
          throw new BadRequestException('Unit cost cannot be negative');
        }
      }

      // Delete existing items and create new ones in a transaction
      await this.prisma.$transaction([
        this.prisma.purchaseItem.deleteMany({
          where: { purchaseId: id },
        }),
        this.prisma.purchaseItem.createMany({
          data: dto.items.map((item) => ({
            purchaseId: id,
            productId: item.productId,
            qty: item.qty,
            unitCost: item.unitCost,
          })),
        }),
      ]);
    }

    const updated = await this.prisma.purchase.update({
      where: { id },
      data: {
        supplier: dto.supplier !== undefined ? dto.supplier || null : undefined,
        comment: dto.comment !== undefined ? dto.comment || null : undefined,
      },
    });

    return {
      id: updated.id,
      supplier: updated.supplier,
      comment: updated.comment,
      status: updated.status as 'DRAFT' | 'POSTED' | 'CANCELED',
      updatedAt: updated.updatedAt,
    };
  }

  async post(
    id: string,
    options?: PostPurchaseDto,
  ): Promise<{
    id: string;
    status: 'POSTED';
    postedAt: Date;
    movementsCreated: number;
  }> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase with id ${id} not found`);
    }

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT purchases can be posted');
    }

    if (purchase.items.length === 0) {
      throw new BadRequestException('Purchase must have items to post');
    }

    // Post purchase in a transaction
    const postedAt = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      // Create inventory movements (IN) for each item
      const movements = await Promise.all(
        purchase.items.map((item) =>
          tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              quantity: item.qty, // Positive for IN
              type: 'IN',
              sourceType: 'PURCHASE',
              sourceId: purchase.id,
            },
          }),
        ),
      );

      // Create FIFO lots for each purchase item
      const lots = await Promise.all(
        purchase.items.map((item) =>
          tx.inventoryLot.create({
            data: {
              productId: item.productId,
              purchaseId: purchase.id,
              unitCost: item.unitCost,
              qtyReceived: item.qty,
              qtyRemaining: item.qty,
              receivedAt: postedAt,
            },
          }),
        ),
      );

      // Update purchase status
      const updated = await tx.purchase.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt,
        },
      });

      // Optionally update product costPrice
      if (options?.updateCostPrice) {
        // Update costPrice for each product with the latest purchase cost
        // Group by productId and take the last unitCost (in case of multiple items for same product)
        const productCostMap = new Map<string, number>();
        for (const item of purchase.items) {
          productCostMap.set(item.productId, item.unitCost);
        }

        await Promise.all(
          Array.from(productCostMap.entries()).map(([productId, unitCost]) =>
            tx.product.update({
              where: { id: productId },
              data: { costPrice: unitCost },
            }),
          ),
        );
      }

      return {
        purchase: updated,
        movementsCount: movements.length,
        lotsCount: lots.length,
      };
    });

    return {
      id: result.purchase.id,
      status: 'POSTED',
      postedAt: result.purchase.postedAt!,
      movementsCreated: result.movementsCount,
    };
  }

  async cancel(id: string): Promise<{
    id: string;
    status: 'CANCELED';
  }> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase with id ${id} not found`);
    }

    if (purchase.status === 'POSTED') {
      throw new BadRequestException('Cannot cancel a POSTED purchase');
    }

    if (purchase.status === 'CANCELED') {
      throw new BadRequestException('Purchase is already canceled');
    }

    const updated = await this.prisma.purchase.update({
      where: { id },
      data: {
        status: 'CANCELED',
      },
    });

    return {
      id: updated.id,
      status: 'CANCELED',
    };
  }
}
