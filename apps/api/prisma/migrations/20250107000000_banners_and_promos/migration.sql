-- CreateEnum
CREATE TYPE "BannerMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "PromoCtaType" AS ENUM ('PRODUCT', 'URL');

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "mediaType" "BannerMediaType" NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "promoSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ctaType" "PromoCtaType" NOT NULL DEFAULT 'URL',
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_media" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "mediaType" "BannerMediaType" NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "promo_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_pages_slug_key" ON "promo_pages"("slug");

-- AddForeignKey
ALTER TABLE "promo_media" ADD CONSTRAINT "promo_media_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promo_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;








