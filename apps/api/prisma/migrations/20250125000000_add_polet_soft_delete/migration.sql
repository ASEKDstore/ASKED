-- AlterTable
ALTER TABLE "polet" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT;

-- CreateIndex
CREATE INDEX "polet_deletedAt_idx" ON "polet"("deletedAt");

