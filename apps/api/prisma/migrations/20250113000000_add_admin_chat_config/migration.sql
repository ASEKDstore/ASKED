-- CreateTable
CREATE TABLE "admin_chat_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "chatId" TEXT NOT NULL,
    "threadId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_chat_config_pkey" PRIMARY KEY ("id")
);

