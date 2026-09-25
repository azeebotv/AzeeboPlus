-- CreateTable: Create "system_settings" table (missing from initial migration)
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on "key"
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex: Index on "category"
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex: Index on "isPublic"
CREATE INDEX "system_settings_isPublic_idx" ON "system_settings"("isPublic");
