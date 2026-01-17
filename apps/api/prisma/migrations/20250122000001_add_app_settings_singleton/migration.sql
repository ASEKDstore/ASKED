-- CreateTable
CREATE TABLE "app_settings_singleton" (
    "id" TEXT NOT NULL,
    "globalMaintenanceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_singleton_pkey" PRIMARY KEY ("id")
);

-- Insert default singleton record
INSERT INTO "app_settings_singleton" ("id", "globalMaintenanceEnabled", "updatedAt")
VALUES ('singleton', false, NOW());

