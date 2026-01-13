-- AlterEnum
ALTER TYPE "InventoryMovementSourceType" ADD VALUE 'RETURN';
ALTER TYPE "InventoryMovementSourceType" ADD VALUE 'WRITE_OFF';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "cogsTotal" INTEGER;
ALTER TABLE "order_items" ADD COLUMN "profitTotal" INTEGER;

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "unitCost" INTEGER NOT NULL,
    "qtyReceived" INTEGER NOT NULL,
    "qtyRemaining" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_allocations" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "writeOffId" TEXT,
    "qty" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_lots_productId_receivedAt_idx" ON "inventory_lots"("productId", "receivedAt");

-- CreateIndex
CREATE INDEX "inventory_lots_productId_qtyRemaining_idx" ON "inventory_lots"("productId", "qtyRemaining");

-- CreateIndex
CREATE INDEX "lot_allocations_lotId_idx" ON "lot_allocations"("lotId");

-- CreateIndex
CREATE INDEX "lot_allocations_orderItemId_idx" ON "lot_allocations"("orderItemId");

-- CreateIndex
CREATE INDEX "lot_allocations_writeOffId_idx" ON "lot_allocations"("writeOffId");

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_allocations" ADD CONSTRAINT "lot_allocations_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_allocations" ADD CONSTRAINT "lot_allocations_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

