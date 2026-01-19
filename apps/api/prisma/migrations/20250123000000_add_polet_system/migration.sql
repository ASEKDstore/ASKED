-- CreateEnum
CREATE TYPE "PoletStatus" AS ENUM ('DRAFT', 'RECEIVED', 'DISASSEMBLED', 'POSTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DeliveryDistributionMethod" AS ENUM ('BY_QUANTITY');

-- CreateTable
CREATE TABLE "polet" (
    "id" TEXT NOT NULL,
    "nazvanie" VARCHAR(255) NOT NULL,
    "status" "PoletStatus" NOT NULL DEFAULT 'DRAFT',
    "cenaPoleta" INTEGER NOT NULL,
    "dostavka" INTEGER NOT NULL,
    "prochieRashody" INTEGER NOT NULL DEFAULT 0,
    "obshayaSumma" INTEGER NOT NULL,
    "metodRaspredeleniya" "DeliveryDistributionMethod" NOT NULL DEFAULT 'BY_QUANTITY',
    "primernoeKolvo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poziciya_poleta" (
    "id" TEXT NOT NULL,
    "poletId" TEXT NOT NULL,
    "nazvanie" VARCHAR(255) NOT NULL,
    "kolichestvo" INTEGER NOT NULL,
    "sebestoimostNaEd" INTEGER NOT NULL DEFAULT 0,
    "tovarId" TEXT,

    CONSTRAINT "poziciya_poleta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "poziciya_poleta_poletId_idx" ON "poziciya_poleta"("poletId");

-- AddForeignKey
ALTER TABLE "poziciya_poleta" ADD CONSTRAINT "poziciya_poleta_poletId_fkey" FOREIGN KEY ("poletId") REFERENCES "polet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poziciya_poleta" ADD CONSTRAINT "poziciya_poleta_tovarId_fkey" FOREIGN KEY ("tovarId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add sourcePoletId and sourcePoziciyaPoletaId to Product
ALTER TABLE "products" ADD COLUMN "sourcePoletId" TEXT,
ADD COLUMN "sourcePoziciyaPoletaId" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sourcePoletId_fkey" FOREIGN KEY ("sourcePoletId") REFERENCES "polet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sourcePoziciyaPoletaId_fkey" FOREIGN KEY ("sourcePoziciyaPoletaId") REFERENCES "poziciya_poleta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

