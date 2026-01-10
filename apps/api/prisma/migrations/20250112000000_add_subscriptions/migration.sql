-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "lastPaidAt" TIMESTAMP(3) NOT NULL,
    "periodMonths" INTEGER NOT NULL DEFAULT 1,
    "remindBeforeDays" INTEGER NOT NULL DEFAULT 1,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "lastRemindedAt" TIMESTAMP(3),
    "lastRemindedForDueAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_isActive_nextDueAt_idx" ON "subscriptions"("isActive", "nextDueAt");

-- CreateIndex
CREATE INDEX "subscriptions_nextDueAt_idx" ON "subscriptions"("nextDueAt");

