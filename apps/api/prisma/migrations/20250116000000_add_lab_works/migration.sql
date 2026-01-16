-- CreateEnum
CREATE TYPE "LabWorkStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LabWorkMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "lab_works" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" "LabWorkStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_work_media" (
    "id" TEXT NOT NULL,
    "labWorkId" TEXT NOT NULL,
    "type" "LabWorkMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lab_work_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_works_status_createdAt_idx" ON "lab_works"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "lab_works_slug_key" ON "lab_works"("slug");

-- CreateIndex
CREATE INDEX "lab_work_media_labWorkId_sort_idx" ON "lab_work_media"("labWorkId", "sort");

-- AddForeignKey
ALTER TABLE "lab_work_media" ADD CONSTRAINT "lab_work_media_labWorkId_fkey" FOREIGN KEY ("labWorkId") REFERENCES "lab_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

