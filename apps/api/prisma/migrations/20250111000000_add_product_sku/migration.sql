-- AlterTable: Add SKU field (nullable, unique when present)
ALTER TABLE "products" ADD COLUMN "sku" TEXT;

-- CreateIndex: Unique index for SKU (allows NULL)
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku") WHERE "sku" IS NOT NULL;

-- CreateIndex: Regular index for SKU lookups
CREATE INDEX "products_sku_idx" ON "products"("sku");

