import { prisma } from '../setup';

export interface CreateProductOptions {
  title?: string;
  price?: number;
  costPrice?: number;
  packagingCost?: number;
  stock?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export interface CreatePurchaseOptions {
  supplier?: string;
  comment?: string;
  items: Array<{
    productId: string;
    qty: number;
    unitCost: number;
  }>;
}

export interface CreateOrderOptions {
  userId?: string;
  items: Array<{
    productId: string;
    qty: number;
  }>;
  customerName?: string;
  customerPhone?: string;
  channel?: 'AS' | 'LAB';
}

/**
 * Create a test product
 */
export async function createProduct(
  options: CreateProductOptions = {},
): Promise<{
  id: string;
  title: string;
  price: number;
  costPrice: number | null;
  packagingCost: number | null;
  stock: number;
}> {
  const product = await prisma.product.create({
    data: {
      title: options.title || 'Test Product',
      price: options.price ?? 1000,
      costPrice: options.costPrice ?? null,
      packagingCost: options.packagingCost ?? null,
      status: options.status || 'ACTIVE',
      stock: options.stock ?? 0,
      currency: 'RUB',
    },
  });

  return product;
}

/**
 * Create and post a purchase (creates lots)
 */
export async function postPurchase(
  options: CreatePurchaseOptions,
): Promise<{
  id: string;
  postedAt: Date;
  items: Array<{
    productId: string;
    qty: number;
    unitCost: number;
  }>;
  lots: Array<{
    id: string;
    productId: string;
    unitCost: number;
    qtyReceived: number;
    qtyRemaining: number;
  }>;
}> {
  const purchase = await prisma.$transaction(async (tx) => {
    // Create purchase
    const created = await tx.purchase.create({
      data: {
        supplier: options.supplier || null,
        comment: options.comment || null,
        status: 'DRAFT',
        items: {
          create: options.items.map((item) => ({
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

    const postedAt = new Date();

    // Post purchase: create movements and lots
    await Promise.all(
      created.items.map(async (item) => {
        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            quantity: item.qty,
            type: 'IN',
            sourceType: 'PURCHASE',
            sourceId: created.id,
          },
        });

        // Create lot
        await tx.inventoryLot.create({
          data: {
            productId: item.productId,
            purchaseId: created.id,
            unitCost: item.unitCost,
            qtyReceived: item.qty,
            qtyRemaining: item.qty,
            receivedAt: postedAt,
          },
        });
      }),
    );

    // Update purchase status
    await tx.purchase.update({
      where: { id: created.id },
      data: {
        status: 'POSTED',
        postedAt,
      },
    });

    // Fetch created lots
    const lots = await tx.inventoryLot.findMany({
      where: { purchaseId: created.id },
    });

    return {
      ...created,
      postedAt,
      lots,
    };
  });

  return purchase;
}

/**
 * Get current stock from movements
 */
export async function getStockFromMovements(productId: string): Promise<number> {
  const result = await prisma.inventoryMovement.aggregate({
    where: { productId },
    _sum: {
      quantity: true,
    },
  });
  return result._sum.quantity ?? 0;
}

/**
 * Get current stock from lots
 */
export async function getStockFromLots(productId: string): Promise<number> {
  const result = await prisma.inventoryLot.aggregate({
    where: { productId },
    _sum: {
      qtyRemaining: true,
    },
  });
  return result._sum.qtyRemaining ?? 0;
}

/**
 * Get all lots for a product
 */
export async function getLots(productId: string): Promise<
  Array<{
    id: string;
    unitCost: number;
    qtyReceived: number;
    qtyRemaining: number;
    receivedAt: Date;
  }>
> {
  return prisma.inventoryLot.findMany({
    where: { productId },
    orderBy: { receivedAt: 'asc' },
  });
}

/**
 * Get all allocations for an order item
 */
export async function getAllocationsForOrderItem(orderItemId: string): Promise<
  Array<{
    id: string;
    lotId: string;
    qty: number;
    unitCost: number;
  }>
> {
  const allocations = await prisma.lotAllocation.findMany({
    where: { orderItemId },
    include: {
      lot: {
        select: {
          id: true,
          unitCost: true,
        },
      },
    },
  });

  return allocations.map((a) => ({
    id: a.id,
    lotId: a.lotId,
    qty: a.qty,
    unitCost: a.unitCost,
  }));
}

