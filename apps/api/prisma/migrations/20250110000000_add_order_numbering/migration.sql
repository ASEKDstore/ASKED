-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('AS', 'LAB');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "channel" "OrderChannel";
ALTER TABLE "orders" ADD COLUMN "seq" INTEGER;
ALTER TABLE "orders" ADD COLUMN "number" TEXT;

-- Set default channel for existing orders
UPDATE "orders" SET "channel" = 'AS' WHERE "channel" IS NULL;

-- Now set NOT NULL constraint after backfilling
ALTER TABLE "orders" ALTER COLUMN "channel" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "channel" SET DEFAULT 'AS';

-- CreateTable
CREATE TABLE "order_counters" (
    "channel" "OrderChannel" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_counters_pkey" PRIMARY KEY ("channel")
);

-- CreateIndex
CREATE INDEX "orders_channel_seq_idx" ON "orders"("channel", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");

-- CreateIndex
CREATE INDEX "orders_number_idx" ON "orders"("number");

-- Backfill existing orders: assign AS channel, generate seq and number
-- This will be done by the backfill script, but we set defaults here
UPDATE "orders" SET "channel" = 'AS' WHERE "channel" IS NULL;

