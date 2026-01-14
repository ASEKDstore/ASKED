import { ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for FIFO lot allocation logic
 * Extracted for testability and reuse across order creation and write-offs
 */
export class FifoAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Allocate lots FIFO for a given quantity
   * Returns allocations created and total COGS
   */
  async allocateLots(
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    productId: string,
    quantity: number,
    orderItemId: string | null,
    writeOffId: string | null,
  ): Promise<{
    allocations: Array<{
      lotId: string;
      qty: number;
      unitCost: number;
    }>;
    totalCogs: number;
  }> {
    if (quantity <= 0) {
      throw new ConflictException('Quantity must be positive');
    }

    let remainingNeeded = quantity;
    let totalCogs = 0;
    const allocations: Array<{ lotId: string; qty: number; unitCost: number }> = [];

    // Fetch lots for this product ordered by receivedAt ASC (FIFO) where qtyRemaining > 0
    const lots = await tx.inventoryLot.findMany({
      where: {
        productId,
        qtyRemaining: { gt: 0 },
      },
      orderBy: { receivedAt: 'asc' },
    });

    if (lots.length === 0) {
      throw new ConflictException(`No available lots for product ${productId}`);
    }

    // Allocate qty across lots FIFO
    for (const lot of lots) {
      if (remainingNeeded <= 0) break;

      const take = Math.min(remainingNeeded, lot.qtyRemaining);

      // Runtime assertion: lot remaining must be non-negative
      if (process.env.NODE_ENV !== 'production' && lot.qtyRemaining < 0) {
        throw new Error(`INVARIANT VIOLATION: Lot ${lot.id} has negative qtyRemaining: ${lot.qtyRemaining}`);
      }

      const allocationCogs = take * lot.unitCost;
      totalCogs += allocationCogs;

      // Decrease lot remaining
      const updatedLot = await tx.inventoryLot.update({
        where: { id: lot.id },
        data: {
          qtyRemaining: {
            decrement: take,
          },
        },
      });

      // Runtime assertion: after decrement, remaining must be non-negative
      if (process.env.NODE_ENV !== 'production' && updatedLot.qtyRemaining < 0) {
        throw new Error(
          `INVARIANT VIOLATION: After allocation, lot ${lot.id} has negative qtyRemaining: ${updatedLot.qtyRemaining}`,
        );
      }

      // Create allocation record
      await tx.lotAllocation.create({
        data: {
          lotId: lot.id,
          orderItemId,
          writeOffId,
          qty: take,
          unitCost: lot.unitCost,
        },
      });

      allocations.push({
        lotId: lot.id,
        qty: take,
        unitCost: lot.unitCost,
      });

      remainingNeeded -= take;
    }

    // Runtime assertion: all quantity must be allocated
    if (process.env.NODE_ENV !== 'production' && remainingNeeded > 0) {
      throw new Error(
        `INVARIANT VIOLATION: Not all quantity allocated. Needed: ${quantity}, Allocated: ${quantity - remainingNeeded}, Remaining: ${remainingNeeded}`,
      );
    }

    if (remainingNeeded > 0) {
      throw new ConflictException(
        `Not enough stock in lots. Needed: ${quantity}, allocated: ${quantity - remainingNeeded}`,
      );
    }

    // Runtime assertion: allocations sum must equal requested quantity
    const allocationsSum = allocations.reduce((sum, a) => sum + a.qty, 0);
    if (process.env.NODE_ENV !== 'production' && allocationsSum !== quantity) {
      throw new Error(
        `INVARIANT VIOLATION: Allocations sum (${allocationsSum}) does not equal requested quantity (${quantity})`,
      );
    }

    // Runtime assertion: COGS must equal sum of (allocation.qty * allocation.unitCost)
    const calculatedCogs = allocations.reduce((sum, a) => sum + a.qty * a.unitCost, 0);
    if (process.env.NODE_ENV !== 'production' && Math.abs(totalCogs - calculatedCogs) > 0.01) {
      throw new Error(
        `INVARIANT VIOLATION: COGS mismatch. Calculated: ${calculatedCogs}, Stored: ${totalCogs}`,
      );
    }

    // Runtime assertion: Verify all lots still have non-negative remaining
    const finalLots = await tx.inventoryLot.findMany({
      where: {
        productId,
        id: { in: allocations.map((a) => a.lotId) },
      },
    });

    for (const lot of finalLots) {
      if (process.env.NODE_ENV !== 'production' && lot.qtyRemaining < 0) {
        throw new Error(
          `INVARIANT VIOLATION: Lot ${lot.id} has negative qtyRemaining after allocation: ${lot.qtyRemaining}`,
        );
      }
    }

    return {
      allocations,
      totalCogs,
    };
  }
}

