-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUST');

-- CreateEnum
CREATE TYPE "InventoryMovementSourceType" AS ENUM ('ORDER', 'MANUAL', 'PURCHASE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "costPrice" INTEGER,
ADD COLUMN "packagingCost" INTEGER;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "salePriceAtTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "costPriceAtTime" INTEGER,
ADD COLUMN "packagingCostAtTime" INTEGER;

-- Backfill salePriceAtTime from priceSnapshot for existing records
UPDATE "order_items" SET "salePriceAtTime" = "priceSnapshot" WHERE "salePriceAtTime" = 0;

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "sourceType" "InventoryMovementSourceType" NOT NULL,
    "sourceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_movements_productId_createdAt_idx" ON "inventory_movements"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_movements_sourceType_sourceId_idx" ON "inventory_movements"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "inventory_movements_type_createdAt_idx" ON "inventory_movements"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

