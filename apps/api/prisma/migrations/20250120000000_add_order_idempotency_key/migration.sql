-- AlterTable: Add idempotencyKey column to orders table
ALTER TABLE "orders" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex: Unique index for idempotencyKey (allows NULL)
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;

-- CreateIndex: Regular index for idempotencyKey lookups
CREATE INDEX "orders_idempotencyKey_idx" ON "orders"("idempotencyKey");

