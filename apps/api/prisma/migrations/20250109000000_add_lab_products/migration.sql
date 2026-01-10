-- CreateEnum
CREATE TYPE "LabCtaType" AS ENUM ('NONE', 'PRODUCT', 'URL');

-- CreateTable
CREATE TABLE "lab_products" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "coverMediaType" "BannerMediaType" NOT NULL,
    "coverMediaUrl" TEXT NOT NULL,
    "ctaType" "LabCtaType" NOT NULL DEFAULT 'NONE',
    "ctaProductId" TEXT,
    "ctaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_product_media" (
    "id" TEXT NOT NULL,
    "labProductId" TEXT NOT NULL,
    "type" "BannerMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_product_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_products_isActive_sortOrder_idx" ON "lab_products"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "lab_products_createdAt_idx" ON "lab_products"("createdAt");

-- CreateIndex
CREATE INDEX "lab_product_media_labProductId_sortOrder_idx" ON "lab_product_media"("labProductId", "sortOrder");

-- AddForeignKey
ALTER TABLE "lab_products" ADD CONSTRAINT "lab_products_ctaProductId_fkey" FOREIGN KEY ("ctaProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_product_media" ADD CONSTRAINT "lab_product_media_labProductId_fkey" FOREIGN KEY ("labProductId") REFERENCES "lab_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;






