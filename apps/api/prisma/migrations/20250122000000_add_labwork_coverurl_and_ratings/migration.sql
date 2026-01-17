-- AlterTable
ALTER TABLE "lab_works" ADD COLUMN "coverUrl" TEXT;

-- CreateTable
CREATE TABLE "lab_work_ratings" (
    "id" TEXT NOT NULL,
    "labWorkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_work_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_work_ratings_labWorkId_userId_key" ON "lab_work_ratings"("labWorkId", "userId");

-- CreateIndex
CREATE INDEX "lab_work_ratings_labWorkId_idx" ON "lab_work_ratings"("labWorkId");

-- AddForeignKey
ALTER TABLE "lab_work_ratings" ADD CONSTRAINT "lab_work_ratings_labWorkId_fkey" FOREIGN KEY ("labWorkId") REFERENCES "lab_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_work_ratings" ADD CONSTRAINT "lab_work_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

