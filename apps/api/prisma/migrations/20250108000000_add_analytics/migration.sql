-- CreateEnum
CREATE TYPE "AppEventType" AS ENUM ('PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_STARTED', 'PURCHASE');

-- CreateTable
CREATE TABLE "telegram_channel_snapshots" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "subscriberCount" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_channel_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_posts" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "text" TEXT,
    "textExcerpt" VARCHAR(500),
    "views" INTEGER NOT NULL DEFAULT 0,
    "forwards" INTEGER NOT NULL DEFAULT 0,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_post_metric_snapshots" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "views" INTEGER NOT NULL,
    "forwards" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_post_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_events" (
    "id" TEXT NOT NULL,
    "eventType" "AppEventType" NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "productId" TEXT,
    "source" TEXT,
    "campaign" TEXT,
    "postId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_channel_snapshots_channelId_snapshotAt_key" ON "telegram_channel_snapshots"("channelId", "snapshotAt");

-- CreateIndex
CREATE INDEX "telegram_channel_snapshots_channelId_snapshotAt_idx" ON "telegram_channel_snapshots"("channelId", "snapshotAt");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_posts_channelId_messageId_key" ON "telegram_posts"("channelId", "messageId");

-- CreateIndex
CREATE INDEX "telegram_posts_channelId_date_idx" ON "telegram_posts"("channelId", "date");

-- CreateIndex
CREATE INDEX "telegram_posts_views_idx" ON "telegram_posts"("views");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_post_metric_snapshots_postId_snapshotAt_key" ON "telegram_post_metric_snapshots"("postId", "snapshotAt");

-- CreateIndex
CREATE INDEX "telegram_post_metric_snapshots_postId_snapshotAt_idx" ON "telegram_post_metric_snapshots"("postId", "snapshotAt");

-- CreateIndex
CREATE INDEX "app_events_eventType_createdAt_idx" ON "app_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "app_events_userId_createdAt_idx" ON "app_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "app_events_productId_createdAt_idx" ON "app_events"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "app_events_postId_createdAt_idx" ON "app_events"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "app_events_sessionId_createdAt_idx" ON "app_events"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "telegram_post_metric_snapshots" ADD CONSTRAINT "telegram_post_metric_snapshots_postId_fkey" FOREIGN KEY ("postId") REFERENCES "telegram_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;











